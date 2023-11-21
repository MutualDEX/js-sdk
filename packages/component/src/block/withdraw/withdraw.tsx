import { FC, useContext, useMemo } from "react";
import { WithdrawForm } from "./withdrawForm";
import {
  useChain,
  useWithdraw,
  useChains,
  usePositionStream,
  OrderlyContext,
} from "@orderly.network/hooks";
import { WalletConnectorContext } from "@/provider";
import { CurrentChain } from "@orderly.network/types";
import { TradingPageContext } from "@/page";

export interface WithdrawProps {
  onCancel?: () => void;
  onOk?: () => void;
}

export const Withdraw: FC<WithdrawProps> = (props) => {
  //   const { state } = useAccount();
  const { connectedChain, wallet, setChain } = useContext(
    WalletConnectorContext
  );

  const { networkId } = useContext(OrderlyContext);

  // const { chains } = useChain("USDC");
  const [chains, { findByChainId }] = useChains(networkId, {
    wooSwapEnabled: false,
    pick: "network_infos",
  });
  // @ts-ignore
  const currentChain = useMemo<CurrentChain | null>(() => {
    if (!connectedChain) return null;

    const chainId = parseInt(connectedChain.id);
    const chain = findByChainId(chainId);

    return {
      ...connectedChain,
      id: chainId,
      info: chain,
    };
  }, [connectedChain, findByChainId]);

  const { maxAmount, availableBalance, unsettledPnL, withdraw } = useWithdraw();
  const context = useContext(TradingPageContext);
  const symbol = context.symbol;
  const [data] = usePositionStream(symbol);
  const hasPositions = data?.rows?.length! > 0;

  return (
    <WithdrawForm
      address={wallet?.accounts?.[0].address}
      chain={currentChain}
      // @ts-ignore
      chains={chains}
      walletName={wallet?.label}
      switchChain={setChain}
      // @ts-ignore
      decimals={chains?.decimals ?? 2}
      // @ts-ignore
      minAmount={chains?.minimum_withdraw_amount ?? 1}
      maxAmount={maxAmount}
      availableBalance={availableBalance}
      unsettledPnL={unsettledPnL}
      hasPositions={hasPositions}
      onWithdraw={withdraw}
      onOk={props.onOk}
    />
  );
};
