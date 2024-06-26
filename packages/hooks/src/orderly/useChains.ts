import { NetworkId, type API, chainsInfoMap } from "@orderly.network/types";
import { useCallback, useMemo, useRef } from "react";
import { SWRConfiguration } from "swr";
import { useQuery } from "../useQuery";
import { prop } from "ramda";
import { isTestnet } from "@orderly.network/utils";
import { TestnetChains, nativeTokenAddress } from "@orderly.network/types";

export type Chain = API.Chain & {
  nativeToken?: API.TokenInfo;
};

export type Chains<
  T extends NetworkId | undefined = undefined,
  K extends keyof API.Chain | undefined = undefined
> = T extends NetworkId
  ? K extends keyof API.Chain
    ? API.Chain[K][]
    : API.Chain[]
  : K extends keyof API.Chain
  ? {
      testnet: API.Chain[K][];
      mainnet: API.Chain[K][];
    }
  : {
      testnet: API.Chain[];
      mainnet: API.Chain[];
    };

export type UseChainsOptions = {
  filter?: (item: API.Chain) => boolean;
  pick?: "dexs" | "network_infos" | "token_infos";
} & SWRConfiguration;

export type UseChainsReturnObject = {
  findByChainId: (chainId: number, field?: string) => Chain | undefined;
  error: any;
};

export function useChains(
  networkId?: undefined,
  options?: undefined
): [Chains<undefined, undefined>, UseChainsReturnObject];

export function useChains<
  T extends NetworkId | undefined,
  K extends UseChainsOptions | undefined
>(
  networkId?: T,
  options?: K
): [
  Chains<
    T,
    K extends UseChainsOptions
      ? K["pick"] extends keyof API.Chain
        ? K["pick"]
        : undefined
      : undefined
  >,
  UseChainsReturnObject
];

export function useChains(
  networkId?: NetworkId,
  options: UseChainsOptions = {}
) {
  const { pick: pickField, ...swrOptions } = options;

  const filterFun = useRef(options?.filter);
  filterFun.current = options?.filter;

  const chainsMap = useRef(new Map<number, Chain>());

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

  // only prod env return mainnet chains info
  // TODO: remove https://api-evm.orderly.org api base
  const { data: tokenChains, error: tokenError } = useQuery<API.Chain[]>(
    "https://api-evm.orderly.org/v1/public/token",
    { ...commonSwrOpts }
  );

  // only prod env return mainnet chains info
  const { data: chainInfos, error: chainInfoErr } = useQuery(
    "/v1/public/chain_info",
    { ...commonSwrOpts }
  );

  const chains = useMemo(() => {
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

    // TODO: /v1/public/chain_info api data is not match /v1/public/token api data, so it can effect is prod
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
  }, [networkId, tokenChains, chainInfos, pickField]);

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

  return [
    chains,
    {
      findByChainId,
      error: tokenError,
    },
  ];
}

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
