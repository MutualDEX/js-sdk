import { useEffect } from "react";
import { useWS } from "../useWS";
import { useSWRConfig } from "swr";
import { OrderStatus, WSMessage } from "@orderly.network/types";
import { useAccount } from "../useAccount";
import { unstable_serialize } from "swr/infinite";
import { useDebouncedCallback } from "use-debounce";
import { useEventEmitter } from "../useEventEmitter";

export const usePrivateDataObserver = () => {
  const ws = useWS();
  const { mutate } = useSWRConfig();
  const ee = useEventEmitter();
  const { state } = useAccount();

  // const updatePositions = useDebouncedCallback(() => {
  //   const key = ["/v1/positions", state.accountId];
  //   console.log("------------->>>>>>>>>> deboundced");
  //   mutate(key);
  // }, 2000);

  const updateOrders = useDebouncedCallback(() => {
    mutate(
      unstable_serialize(() => [
        `/v1/orders?size=100&page=1&status=${OrderStatus.INCOMPLETE}`,
        state.accountId,
      ])
    );

    mutate(
      unstable_serialize(() => [
        `/v1/orders?size=100&page=1&status=${OrderStatus.NEW}`,
        state.accountId,
      ])
    );

    // ee.emit("orders:changed");
  }, 500);

  // orders
  useEffect(() => {
    if (!state.accountId) return;
    const unsubscribe = ws.privateSubscribe("executionreport", {
      onMessage: (data: any) => {
        updateOrders();
        ee.emit("orders:changed", data);
      },
    });

    return () => unsubscribe?.();
  }, [state.accountId]);

  // positions
  useEffect(() => {
    if (!state.accountId) return;
    const key = ["/v1/positions", state.accountId];
    const unsubscribe = ws.privateSubscribe("position", {
      onMessage: (data: { positions: WSMessage.Position[] }) => {
        const { positions: nextPostions } = data;

        // console.log("ws----- positions data-----", data);

        // updatePositions();

        mutate(
          key,
          (prevPositions: any) => {
            // return nextPostions;
            if (!!prevPositions) {
              return {
                ...prevPositions,
                rows: prevPositions.rows.map((row: any) => {
                  const item = nextPostions.find(
                    (item) => item.symbol === row.symbol
                  );
                  if (item) {
                    return {
                      symbol: item.symbol,
                      position_qty: item.positionQty,
                      cost_position: item.costPosition,
                      last_sum_unitary_funding: item.lastSumUnitaryFunding,
                      pending_long_qty: item.pendingLongQty,
                      pending_short_qty: item.pendingShortQty,
                      settle_price: item.settlePrice,
                      average_open_price: item.averageOpenPrice,
                      unsettled_pnl: item.unsettledPnl,
                      mark_price: item.markPrice,
                      est_liq_price: item.estLiqPrice,
                      timestamp: Date.now(),
                      imr: item.imr,
                      mmr: item.mmr,
                      IMR_withdraw_orders: item.imrwithOrders,
                      MMR_with_orders: item.mmrwithOrders,
                      pnl_24_h: item.pnl24H,
                      fee_24_h: item.fee24H,
                    };
                  }

                  return row;
                }),
              };
            }
          },
          {
            revalidate: false,
          }
        );
      },
    });
    return () => {
      unsubscribe?.();
    };
  }, [state.accountId]);
};
