import { useCallback, useContext, useRef, useState } from "react";
import { useBoolean } from "../useBoolean";
import { useAccountInstance } from "../useAccountInstance";
import { utils } from "@orderly.network/core";
import { pick } from "ramda";
import { OrderlyContext } from "../orderlyContext";
import { isNativeTokenChecker } from "./constants";
import { useWalletSubscription } from "../orderly/useWalletSubscription";
import { WS_WalletStatusEnum } from "@orderly.network/types";

/**
 * PM doc:
 * https://www.figma.com/file/RNSrMH6zkqULTfZqYzhGRr/Dex-C4-Draft?type=design&node-id=975-21917&mode=design&t=zd8vtA5mTGTw8SVI-0
 * 
 * 1. fee 精度 swap_support.woofi_dex_precision+3，四捨五入
 * 2. price 精度 = abs(woofi_dex_precision - 5)，無條件捨去
 * 3. orderly deposit fee = $0
 * 4. deposit pop-ups 上面 fee 括弧裡面，不顯示 fee 為 0 的 token。舉例 : dst gas fee = 0 ETH, swap fee = 0.04 USDC

 * 這邊就顯示 $0.04 ( 0.04 USDC )
 * */
const woofiDexDepositorAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "address",
        name: "fromToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fromAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "toToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minToAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "toAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "orderlyNativeFees",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "accountId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "brokerHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "tokenHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "tokenAmount",
        type: "uint128",
      },
    ],
    name: "WOOFiDexSwap",
    type: "event",
  },
  {
    inputs: [],
    name: "NATIVE_PLACEHOLDER",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "stuckToken", type: "address" }],
    name: "inCaseTokenGotStuck",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_wooRouter", type: "address" }],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "orderlyFeeToggle",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "_orderlyFeeToggle", type: "bool" }],
    name: "setOrderlyFeeToggle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "woofiDexVault", type: "address" },
    ],
    name: "setWOOFiDexVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_wooRouter", type: "address" }],
    name: "setWooRouter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "to", type: "address" },
      {
        components: [
          { internalType: "address", name: "fromToken", type: "address" },
          { internalType: "uint256", name: "fromAmount", type: "uint256" },
          { internalType: "address", name: "toToken", type: "address" },
          { internalType: "uint256", name: "minToAmount", type: "uint256" },
          {
            internalType: "uint256",
            name: "orderlyNativeFees",
            type: "uint256",
          },
        ],
        internalType: "struct IWOOFiDexDepositor.Infos",
        name: "infos",
        type: "tuple",
      },
      {
        components: [
          { internalType: "bytes32", name: "accountId", type: "bytes32" },
          { internalType: "bytes32", name: "brokerHash", type: "bytes32" },
          { internalType: "bytes32", name: "tokenHash", type: "bytes32" },
        ],
        internalType: "struct IWOOFiDexDepositor.VaultDeposit",
        name: "vaultDeposit",
        type: "tuple",
      },
    ],
    name: "swap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "wooRouter",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "woofiDexVaults",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

export const useSwap = () => {
  // exec swap contract;
  const [loading, { setTrue: start, setFalse: stop }] = useBoolean(false);
  const account = useAccountInstance();
  const { configStore } = useContext(OrderlyContext);

  const [status, setStatus] = useState<WS_WalletStatusEnum>(
    WS_WalletStatusEnum.NO
  );

  const txHash = useRef<string | undefined>();

  useWalletSubscription({
    onMessage: (message) => {
      const { side, transStatus, trxId } = message;

      if (side === "DEPOSIT" && trxId === txHash.current) {
        setStatus(transStatus);
      }
    },
  });

  const dstValutDeposit = useCallback(() => {
    const brokerId = configStore.get<string>("brokerId");
    return {
      accountId: account.accountIdHashStr,
      brokerHash: utils.parseBrokerHash(brokerId),
      tokenHash: utils.parseTokenHash("USDC"),
    };
  }, [account]);

  const swap = useCallback(
    async (
      woofiDexDepositorAdress: string,
      inputs: {
        fromToken: string;
        fromAmount: string;
        toToken: string;
        minToAmount: string;
        orderlyNativeFees: bigint;
      },
      config: { dst: any; src: any }
    ) => {
      if (!account.walletClient) {
        throw new Error("walletClient is undefined");
      }

      if (!account.address) {
        throw new Error("account.address is undefined");
      }

      if (loading) return;
      start();

      const txPayload = {
        from: account.address,
        to: woofiDexDepositorAdress,
        data: [account.address, inputs, dstValutDeposit()],
        value: isNativeTokenChecker(inputs.fromToken)
          ? BigInt(inputs.fromAmount) + inputs.orderlyNativeFees
          : inputs.orderlyNativeFees,
      };

      try {
        const result = await account.walletClient.sendTransaction(
          woofiDexDepositorAdress,
          "swap",
          txPayload,
          {
            abi: woofiDexDepositorAbi,
          }
        );

        stop();

        console.log("single swap result", result);

        txHash.current = result.hash;

        return pick(["from", "to", "hash", "value"], result);
      } catch (e: any) {
        console.log("调用合约报错：", e);

        throw new Error(e.errorCode);
      }
    },
    [loading, account]
  );

  return {
    swap,
    loading,
    status,
  };
};
