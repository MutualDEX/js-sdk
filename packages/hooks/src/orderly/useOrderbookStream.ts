import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTickerStream } from "./useTickerStream";
import { useMarkPrice } from "./useMarkPrice";
import { useWS } from "../useWS";
import { useEventEmitter } from "../useEventEmitter";
import { useSymbolsInfo } from "./useSymbolsInfo";
import { Decimal } from "@orderly.network/utils";
import { max, min } from "ramda";
import { SDKError } from "@orderly.network/types";

export type OrderBookItem = number[];

export type OrderbookData = {
  asks: OrderBookItem[];
  bids: OrderBookItem[];
};

const paddingFn = (len: number) =>
  Array(len).fill([Number.NaN, Number.NaN, Number.NaN, Number.NaN] as OrderBookItem);

const asksSortFn = (a: OrderBookItem, b: OrderBookItem) => a[0] - b[0];

const bidsSortFn = (a: OrderBookItem, b: OrderBookItem) => b[0] - a[0];

// const commonSortFn = (a: OrderBookItem, b: OrderBookItem) => b[0] - a[0];

const reduceItems = (
  depth: number | undefined,
  level: number,
  data: OrderBookItem[],
  asks = false
) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  let newData = [...data];
  const result: OrderBookItem[] = [];

  //

  if (typeof depth !== "undefined") {
    const prices = new Map<number, number[]>();
    for (let i = 0; i < data.length; i++) {
      const [price, quantity] = data[i];
      if (isNaN(price) || isNaN(quantity)) continue;
      let priceKey;

      if (asks) {
        priceKey = new Decimal(Math.ceil(price / depth)).mul(depth).toNumber();
      } else {
        priceKey = new Decimal(Math.floor(price / depth)).mul(depth).toNumber();
      }

      if (depth < 1 && depth > 0 && priceKey.toString().indexOf(".") !== -1) {
        const priceStr = price.toString();
        const index = priceStr.indexOf(".");
        const decimal = priceStr.slice(index + 1);
        const decimalDepth = depth.toString().slice(2).length;
        const decimalStr = decimal.slice(0, min(decimal.length, decimalDepth));
        priceKey = new Decimal(
          priceStr.slice(0, index) + "." + decimalStr
        ).toNumber();
      }

      // console.log(`reduce items price: ${price}, priceKey: ${priceKey}, depth: ${depth}, resetPriceKey: ${price.toString === priceKey.toString}`);
      // console.log(`ask: ${asks} reduce items price: ${priceKey}`);

      if (prices.has(priceKey)) {
        const item = prices.get(priceKey)!;
        const itemPrice = new Decimal(item[1]).add(quantity).toNumber();

        // prices.push([price, quantity]);
        prices.set(priceKey, [priceKey, itemPrice]);
      } else {
        prices.set(priceKey, [priceKey, quantity]);
      }
    }

    newData = Array.from(prices.values());
  }

  for (let i = 0; i < newData.length; i++) {
    const [price, quantity] = newData[i];
    if (isNaN(price) || isNaN(quantity)) continue;

    const newQuantity = new Decimal(quantity)
      .add(result.length > 0 ? result[result.length - 1][2] : 0)
      .toNumber();

    const newAmount = new Decimal(quantity * price)
      .add(result.length > 0 ? result[result.length - 1][3] : 0)
      .toNumber();

    result.push([price, quantity, newQuantity, newAmount]);
    // if the total is greater than the level, break
    // TODO:
    // if (i + 1 >= level) {
    //   break;
    // }
  }

  return result;
};

/**
 * @name reduceOrderbook
 * @param depth
 * @param level
 * @param data
 */
export const reduceOrderbook = (
  depth: number | undefined,
  level: number,
  padding: boolean,
  data: OrderbookData,
): OrderbookData => {
  let asks = reduceItems(depth, level, data.asks, true);

  let bids = reduceItems(depth, level, data.bids);

  /// not empty and asks.price <= bids.price
  if (asks.length !== 0 && bids.length !== 0 && asks[0][0] <= bids[0][0]) {
    if (asks.length === 1) {
      const [price, qty, newQuantity, newAmount] = asks[0];
      asks.shift();
      asks.push([price + (depth === undefined ? 0 : depth), qty, newQuantity, newAmount]);
    } else {
      const [bidPrice] = bids[0];
      while (asks.length > 0) {
        const [askPrice, askQty, newQuantity, newAmount] = asks[0];


        if (askPrice <= bidPrice) {
          // console.log("xxxxxxxxxxx reset ask list begin", [...asks], { ...asks[0] });
          asks.shift();
          let logStr = "";
          for (let index = 0; index < asks.length; index++) {
            if (index === 0) {
              const quantity = asks[index][1] + askQty;
              asks[index][1] = quantity;
              asks[index][2] = quantity;
              // asks[index][3] += newAmount;
              // FIXME: fix this code later
              asks[index][3] = Math.ceil(quantity) * asks[index][0];
            } else {
              // asks[index][3] += newAmount;
              // FIXME: fix this code later
              asks[index][3] = asks[index][0] * asks[index][1] + asks[index - 1][3];
            }
            logStr += `index: ${index} ${asks[index]}\n`;
          }
          // console.log("xxxxxxxxxxx reset ask list end", logStr);
        } else {
          break;
        }
      }
    }
  }

  asks = asks.reverse();

  if (padding) {
    asks =
      asks.length < level ? paddingFn(level - asks.length).concat(asks) : asks;
    bids =
      bids.length < level ? bids.concat(paddingFn(level - bids.length)) : bids;
  }

  return {
    asks: asks,
    bids: bids,
  };
};

const mergeItems = (data: OrderBookItem[], update: OrderBookItem[]) => {
  // let index = -1;
  if (data.length === 0) return update;

  data = data.filter(([price]) => !isNaN(price));

  while (update.length > 0) {
    const item = update.shift();
    //
    if (item) {
      const [price, quantity] = item;

      const index = data.findIndex(([p], index) => p === price);
      //
      if (index === -1) {
        if (quantity === 0) continue;
        data.push(item);
      } else {
        if (quantity === 0) {
          data.splice(index, 1);
        } else {
          data[index] = item;
        }
      }
    }
  }

  return data;
};

export const mergeOrderbook = (data: OrderbookData, update: OrderbookData) => {
  let asks = [...data.asks];
  let bids = [...data.bids];

  asks = mergeItems(asks, update.asks).sort(asksSortFn);
  bids = mergeItems(bids, update.bids).sort(bidsSortFn);

  return {
    asks: asks,
    bids: bids,
  };
};

/**  
 * Configuration for the Order Book
 * @level Indicates the number of data entries to return for ask/bid, default is 10
 * @padding Whether to fill in when the actual data entries are less than the level. If filled, it will add [nan, nan, nan, nan]
 *          default is true
 */
export type OrderbookOptions = {
  level?: number;
  padding?: boolean;
};

const INIT_DATA = { asks: [], bids: [] };

/**
 * @name useOrderbookStream
 * @description React hook that returns the current orderbook for a given market
 */
export const useOrderbookStream = (
  symbol: string,
  initial: OrderbookData = INIT_DATA,
  options?: OrderbookOptions
) => {
  if (!symbol) {
    throw new SDKError("useOrderbookStream requires a symbol");
  }

  const level = options?.level ?? 10;
  const padding = options?.padding ?? true;

  const [requestData, setRequestData] = useState<OrderbookData | null>(null);
  const [data, setData] = useState<OrderbookData>(initial);
  const [isLoading, setIsLoading] = useState(true);
  // const [level, setLevel] = useState(() => options?.level ?? 10);

  const config = useSymbolsInfo()[symbol];

  const [depth, setDepth] = useState<number | undefined>();

  // markPrice, lastPrice
  const prevMiddlePrice = useRef<number>(0);

  const depths = useMemo(() => {
    const tick = config("quote_tick");

    return [tick, tick * 10, tick * 100, tick * 1000];
  }, [config("quote_tick")]);

  useEffect(() => {
    setDepth(config("quote_tick"));
  }, [config("quote_tick")]);

  const ws = useWS();

  const ticker = useTickerStream(symbol);

  const eventEmitter = useEventEmitter();

  // const orderbookRequest =

  useEffect(() => {
    setIsLoading(true);
    let ignore = false;
    ws.onceSubscribe(
      {
        event: "request",
        id: `${symbol}@orderbook`,
        params: {
          type: "orderbook",
          symbol: symbol,
        },
      },
      {
        onMessage: (message: any) => {
          if (ignore) return;
          //
          if (!!message) {
            // sort and filter qty > 0
            let bids = [...message.bids.sort(bidsSortFn)];
            bids = bids.filter(
              (item: number[]) => !isNaN(item[0]) && item[1] > 0
            );
            let asks = [...message.asks.sort(asksSortFn)];
            asks = asks.filter(
              (item: number[]) => !isNaN(item[0]) && item[1] > 0
            );

            // const reduceOrderbookData = reduceOrderbook(depth, level, {
            //   bids: bids,
            //   asks: asks,
            // });
            setRequestData({ bids: bids, asks: asks });
            setData({ bids: [...bids], asks: [...asks] });
          }
          setIsLoading(false);
        },
      }
    );

    return () => {
      setRequestData(null);
      ignore = true;
      // clean the data;
      setData(INIT_DATA);
      prevMiddlePrice.current = 0;
    };
  }, [symbol]);

  // const {data:markPrices} = useMarkPricesStream();

  const { data: markPrice } = useMarkPrice(symbol);

  useEffect(() => {
    if (!requestData) return;
    let ignore = false;

    const subscription = ws.subscribe(
      {
        event: "subscribe",
        topic: `${symbol}@orderbookupdate`,
      },
      {
        onMessage: (message: any) => {
          //
          if (ignore) return;
          setData((data) => {
            const mergedData =
              !message.asks && !message.bids
                ? data
                : mergeOrderbook(data, message);
            return mergedData;
            // const reducedData = reduceOrderbook(depth, level, mergedData);
            // return reducedData;
          });
        },
      }
    );

    return () => {
      ignore = true;
      prevMiddlePrice.current = 0;
      subscription?.(); //unsubscribe
    };
  }, [symbol, requestData]);

  const onItemClick = useCallback((item: OrderBookItem) => {
    eventEmitter.emit("orderbook:item:click", item);
  }, []);

  const onDepthChange = useCallback((depth: number) => {
    //
    setDepth(() => depth);
  }, []);


  const reducedData = reduceOrderbook(depth, level, padding, {
    asks: [...data.asks],
    bids: [...data.bids],
  });

  // emit the asks0 and bids0
  useEffect(() => {
    const updateData = [
      reducedData.asks?.[reducedData.asks.length-1]?.[0],
      reducedData.bids?.[0]?.[0]
    ];
    eventEmitter.emit("orderbook:update", updateData);
  }, [reducedData.asks?.[reducedData.asks.length-1]?.[0], reducedData.bids?.[0]?.[0]]);

  const middlePrice = useMemo(() => {
    let asksFrist = 0,
      bidsFirst = 0;

    if (data.asks.length > 0) {
      asksFrist = reducedData.asks?.[reducedData.asks.length-1]?.[0];
    }

    if (data.bids.length > 0) {
      bidsFirst = data.bids[0][0];
    }

    if (isNaN(asksFrist) || isNaN(bidsFirst) || !ticker) return 0;

    

    return [asksFrist, bidsFirst, ticker["24h_close"]].sort()[1];
  }, [ticker?.["24h_close"], data]);

  useEffect(() => {
    prevMiddlePrice.current = middlePrice;
  }, [middlePrice]);

  return [
    {
      asks: reducedData.asks.slice(-level),
      bids: reducedData.bids.slice(0, level),
      markPrice: markPrice,
      middlePrice: [prevMiddlePrice.current, middlePrice],
    },
    { onDepthChange, depth, allDepths: depths, isLoading, onItemClick },
  ];
};

export type useOrderbookStreamReturn = ReturnType<typeof useOrderbookStream>;
