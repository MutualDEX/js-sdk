import { useContext } from "react";
import { PositionsViewFull } from "@/block/positions";
import { usePositionStream, } from "@orderly.network/hooks";
import {
  API,
  AccountStatusEnum,
} from "@orderly.network/types";
import { useAccount } from "@orderly.network/hooks";
import { TradingPageContext } from "@/page";
import { useTabContext } from "@/tab/tabContext";

export const PositionPane = () => {
  const context = useContext(TradingPageContext);
  const { data: tabExtraData } = useTabContext();

  const [data, info, { loading }] = usePositionStream(tabExtraData.showAllSymbol ? "" : context.symbol);
  const { state } = useAccount();


  return (
    <PositionsViewFull
      dataSource={
        state.status < AccountStatusEnum.EnableTrading ? [] : data.rows
      }
      aggregated={data.aggregated}
      isLoading={loading}
      showAllSymbol={tabExtraData.showAllSymbol}
      onSymbolChange={context.onSymbolChange}
    />
  );
};