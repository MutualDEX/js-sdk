import { NetworkId, type API, chainsInfoMap } from "@orderly.network/types";
import { useCallback, useContext, useMemo, useRef } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { OrderlyContext } from "../orderlyContext";
import { useQuery } from "../useQuery";
import { mergeDeepRight, prop } from "ramda";
import { nativeTokenAddress } from "../woo/constants";
import { isTestnet } from "@orderly.network/utils";
import { TestnetChains } from "@orderly.network/types";

type inputOptions = {
  filter?: (item: API.Chain) => boolean;
  pick?: "dexs" | "network_infos" | "token_infos";
  /** if true, use wooSwap api, else use orderly api only  */
  wooSwapEnabled?: boolean;
};

export const useChains = (
  networkId?: NetworkId,
  options: inputOptions & SWRConfiguration = {}
) => {
  const { pick: pickField, wooSwapEnabled, ...swrOptions } = options;
  const { configStore } = useContext(OrderlyContext);

  const filterFun = useRef(options?.filter);
  filterFun.current = options?.filter;

  const chainsMap = useRef(
    new Map<
      number,
      API.Chain & {
        nativeToken?: API.TokenInfo;
      }
    >()
  );

  const commonSwrOpts = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // If false, undefined data gets cached against the key.
    revalidateOnMount: true,
    // dont duplicate a request w/ same key for 1hr
    dedupingInterval: 3_600_000,
    ...swrOptions,
  };

  const { data: tokenChains, error: tokenError } = useQuery<API.Chain[]>(
    "https://api-evm.orderly.org/v1/public/token",
    { ...commonSwrOpts }
  );

  const { data: chainInfos, error: chainInfoErr } = useQuery(
    "/v1/public/chain_info",
    { ...commonSwrOpts }
  );

  const { data: swapSupportRes, error: swapSupportError } = useSWR<any>(
    () =>
      wooSwapEnabled
        ? `${configStore.get("swapSupportApiUrl")}/swap_support`
        : null,
    (url) => fetch(url).then((res) => res.json()),
    { ...commonSwrOpts, ...swrOptions }
  );

  const chains:
    | API.Chain[]
    | {
        testnet: API.Chain[];
        mainnet: API.Chain[];
      } = useMemo(() => {
    const orderlyChainsArr = fillChainsInfo(tokenChains, filterFun.current);

    let testnetArr = [...TestnetChains] as API.Chain[];

    orderlyChainsArr?.forEach((item) => {
      const chainId = item.network_infos?.chain_id;
      chainsMap.current.set(chainId, item);
      updateTestnetInfo(testnetArr, chainId, item);
    });

    testnetArr.forEach((chain) => {
      chainsMap.current.set(chain.network_infos?.chain_id, chain);
    });

    let mainnetArr: API.Chain[] = [];

    if (wooSwapEnabled) {
      if (!swapSupportRes || !swapSupportRes.data) return swapSupportRes;

      const [mainnetChains, testnetChains] = getSwapSupportChains(
        swapSupportRes.data,
        (chainId) =>
          !!orderlyChainsArr?.find(
            (item) => item.network_infos?.chain_id === chainId
          ),
        filterFun.current
      );

      mainnetArr = mainnetChains;
      testnetArr = [...testnetArr, ...testnetChains];

      [...mainnetChains, ...testnetChains].forEach((item) => {
        chainsMap.current.set(item.network_infos?.chain_id, item);
      });
    } else {
      mainnetArr = updateOrderlyChains(
        orderlyChainsArr,
        chainInfos,
        filterFun.current
      );

      mainnetArr.forEach((item) => {
        const chainId = item.network_infos?.chain_id;
        chainsMap.current.set(chainId, item);
        updateTestnetInfo(testnetArr, chainId, item);
      });
    }

    mainnetArr.sort((a, b) => {
      return a.network_infos.bridgeless ? -1 : 1;
    });

    testnetArr.sort((a, b) => {
      return a.network_infos.bridgeless ? -1 : 1;
    });

    if (!!pickField) {
      //@ts-ignore
      testnetArr = testnetArr.map((item) => item[pickField]);
      //@ts-ignore
      mainnetArr = mainnetArr.map((item) => item[pickField]);
    }

    if (networkId === "mainnet") {
      return mainnetArr;
    }

    if (networkId === "testnet") {
      return testnetArr;
    }

    return {
      testnet: testnetArr,
      mainnet: mainnetArr,
    };
  }, [
    networkId,
    tokenChains,
    chainInfos,
    swapSupportRes,
    pickField,
    wooSwapEnabled,
  ]);

  const findByChainId = useCallback(
    (chainId: number, field?: string) => {
      const chain = chainsMap.current.get(chainId);

      if (chain) {
        chain.nativeToken =
          chain.token_infos?.find(
            (item) => item.address === nativeTokenAddress
          ) ||
          ({
            symbol: chain.network_infos?.currency_symbol,
          } as any);
      }

      if (typeof field === "string") {
        return prop(field as never, chain);
      }

      return chain;
    },
    [chains, chainsMap]
  );

  // const findNativeTokenByChainId = useCallback(
  //   (chainId: number): API.TokenInfo | undefined => {
  //     const chain = findByChainId(chainId);
  //     if (!chain) return;
  //
  //   },
  //   [chains]
  // );

  return [
    chains,
    {
      findByChainId,
      // findNativeTokenByChainId,
      error: swapSupportError || tokenError,
      // nativeToken,
    },
  ] as const;
};

/** orderly chains array form (/v1/public/token) api */
export function fillChainsInfo(
  chains?: API.Chain[],
  filter?: (chain: any) => boolean
) {
  let _chains: API.Chain[] = [];

  chains?.forEach((item) => {
    item.chain_details.forEach((chain: any) => {
      const chainId = Number(chain.chain_id);
      const chainInfo = chainsInfoMap.get(chainId);

      const _chain: any = {
        network_infos: {
          name: chain.chain_name ?? chainInfo?.chainName ?? "--",
          chain_id: chainId,
          withdrawal_fee: chain.withdrawal_fee,
          cross_chain_withdrawal_fee: chain.cross_chain_withdrawal_fee,
          bridgeless: true,
        },
        token_infos: [
          {
            symbol: item.token,
            address: chain.contract_address,
            decimals: chain.decimals,
          },
        ],
      };

      if (typeof filter === "function") {
        if (!filter(_chain)) return;
      }

      _chains.push(_chain);
    });
  });

  return _chains;
}

export function getSwapSupportChains(
  data: Record<string, API.Chain>,
  isBridgeless: (chainId: number) => boolean,
  filter?: (chain: any) => boolean
) {
  const mainnet: API.Chain[] = [];
  const testnet: API.Chain[] = [];

  Object.keys(data).forEach((key) => {
    const chain = data[key];

    const item: any = mergeDeepRight(chain, {
      name: key,
      network_infos: {
        bridgeless: isBridgeless(chain.network_infos.chain_id),
        shortName: key,
      },
      token_infos: chain.token_infos.filter(
        (token: API.TokenInfo) => !!token.swap_enable
      ),
    });

    if (item.token_infos?.length === 0) return;

    if (typeof filter === "function") {
      if (!filter(item)) return;
    }

    if (item.network_infos.mainnet) {
      mainnet.push(item);
    } else {
      testnet.push(item);
    }
  });
  return [mainnet, testnet];
}

/** update network_infos by chain_info api(v1/public/chain_info) */
export function updateOrderlyChains(
  chains: API.Chain[],
  chainInfos: any,
  filter?: (chain: any) => boolean
) {
  const _chains: API.Chain[] = [];
  chains.forEach((chain) => {
    let _chain = { ...chain };

    const networkInfo = chainInfos?.find(
      (item: any) => item.chain_id == chain.network_infos.chain_id
    );

    if (networkInfo) {
      const { name, public_rpc_url, currency_symbol, explorer_base_url } =
        networkInfo;
      _chain.network_infos = {
        ..._chain.network_infos,
        name,
        shortName: name,
        public_rpc_url,
        currency_symbol,
        bridge_enable: true,
        mainnet: true,
        explorer_base_url,
        est_txn_mins: null,
        woofi_dex_cross_chain_router: "",
        woofi_dex_depositor: "",
      };
    }

    if (typeof filter === "function") {
      if (!filter(_chain)) return;
    }

    _chains.push(_chain);
  });

  return _chains;
}

/** if chain is testnet, update testnet network_infos */
export function updateTestnetInfo(
  testnetArr: API.Chain[],
  chainId: number,
  chain: API.Chain
) {
  if (isTestnet(chainId)) {
    const index = testnetArr?.findIndex(
      (item) => item.network_infos.chain_id === chainId
    );
    if (index > -1) {
      testnetArr[index] = chain;
    }
  }
}
