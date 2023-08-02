import { OrderBook } from "@/block/orderbook";

export const MyOrderBook = () => {
  return (
    <div className="pr-1">
      <OrderBook asks={[]} bids={[]} markPrice={""} lastPrice={""} />
    </div>
  );
};