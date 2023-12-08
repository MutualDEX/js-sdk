import { useContext, useMemo } from "react";
import { OrderlyAppContext, WalletConnectorContext } from "@/provider";
import { useChains, useWalletConnector } from "@orderly.network/hooks";

export function useGetChains() {
  const { enableSwapDeposit } = useContext(OrderlyAppContext);

  const { connectedChain } = useWalletConnector();

  const [mainChains, { findByChainId }] = useChains("mainnet", {
    wooSwapEnabled: enableSwapDeposit,
    pick: "network_infos",
    filter: (chain: any) =>
      chain.network_infos?.bridge_enable || chain.network_infos?.bridgeless,
  });

  const chainName = useMemo(() => {
    const chain = findByChainId(parseInt(connectedChain?.id!), "network_infos");

    if (!chain) {
      return "Unknown";
    }
    // @ts-ignore

    if (chain.chain_id === 421613) {
      return "Testnet";
    }
    // @ts-ignore
    return chain.name;
  }, [connectedChain, findByChainId]);

  return chainName;
}
