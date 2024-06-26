import { FC, useEffect, useMemo, useRef } from "react";
import { Table } from "@/table";
import { OrderStatus, OrderSide, API } from "@orderly.network/types";
import { cx } from "class-variance-authority";
import { upperCaseFirstLetter } from "@/utils/string";
import { SymbolProvider } from "@/provider";
import { EndReachedBox } from "@/listView/endReachedBox";
import { cn } from "@/utils";
import { columnsBasis } from "@/block/orders/columnsUtil";
import { OrderTrades } from "../orderTrades";
import { PositionEmptyView } from "@/block/positions/full/positionEmptyView";

interface Props {
  dataSource: API.OrderExt[];
  loading?: boolean;
  loadMore?: () => void;
  className?: string;
  //   status: OrderStatus;
  //   onCancelOrder?: (orderId: number, symbol: string) => Promise<any>;
  onSymbolChange?: (symbol: API.Symbol) => void;
}
export const Listview: FC<Props> = (props) => {
  const columns = useMemo(() => {
    const cols = columnsBasis({ onSymbolChange: props.onSymbolChange });

    //

    cols[2] = {
      title: "Side",
      className: "orderly-h-[48px]",
      width: 100,
      dataIndex: "side",
      render: (value: string, record: any) => (
        <span
          className={cx("orderly-font-semibold", {
            "orderly-text-trade-profit":
              record.status !== OrderStatus.CANCELLED &&
              record.status !== OrderStatus.REJECTED &&
              value === OrderSide.BUY,
            "orderly-text-trade-loss":
              record.status !== OrderStatus.CANCELLED &&
              record.status !== OrderStatus.REJECTED &&
              value === OrderSide.SELL,
          })}
        >
          {upperCaseFirstLetter(value)}
        </span>
      ),
    };

    cols[3] = {
      title: "Filled / Quantity",
      className: "orderly-h-[48px] orderly-font-semibold",
      dataIndex: "quantity",
      width: 200,
      render: (value: string, record: any) => {
        return (
          <span
            className={cx("orderly-font-semibold", {
              "orderly-text-trade-profit":
                record.status !== OrderStatus.CANCELLED &&
                record.status !== OrderStatus.REJECTED &&
                record.side === OrderSide.BUY,
              "orderly-text-trade-loss":
                record.status !== OrderStatus.CANCELLED &&
                record.status !== OrderStatus.REJECTED &&
                record.side === OrderSide.SELL,
            })}
          >{`${record.total_executed_quantity} / ${record.quantity}`}</span>
        );
      },
    };

    return cols;
  }, []);

  const divRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={divRef} className="orderly-h-full orderly-overflow-y-auto">
      
        <Table
          bordered
          justified
          showMaskElement={false}
          columns={columns}
          loading={props.loading}
          dataSource={props.dataSource}
          headerClassName="orderly-text-2xs orderly-text-base-contrast-54 orderly-py-3 orderly-bg-base-900"
          className={cn(
            "orderly-text-2xs orderly-text-base-contrast-80",
            props.className
          )}
          generatedRowKey={(record, index) =>
            `${index}${record.order_id || record.algo_order_id}`
          }
          onRow={(record) => {
            // console.log(record);
            if (record.status === OrderStatus.CANCELLED) {
              return {
                className: "orderly-text-base-contrast-20",
                "data-cancelled": "true",
              };
            }
            return {};
          }}
          renderRowContainer={(record, index, children) => {
            return (
              <SymbolProvider
                key={index}
                symbol={record.symbol}
                children={children}
              />
            );
          }}
          expandRowRender={(record, index) => {
            return <OrderTrades record={record} index={index} />;
          }}
          scrollToEnd={() => {
            if (!props.loading) {
              props.loadMore?.();
            }
          }}
        />

        {(!props.dataSource || props.dataSource.length <= 0) && (
          <PositionEmptyView watchRef={divRef} left={0} right={120} />
        )}
    </div>
  );
};
