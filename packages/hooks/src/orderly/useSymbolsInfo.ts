import { useQuery } from "../useQuery";
import { type API } from "@orderly.network/types";
import { createGetter } from "../utils/createGetter";

export const useSymbolsInfo = () => {
  const { data = {} } = useQuery<API.SymbolExt[]>(`/v1/public/info`, {
    focusThrottleInterval: 1000 * 60 * 60 * 24,
    revalidateOnFocus: false,
    formatter(data: { rows: API.Symbol[] }) {
      if (!data?.rows || !data?.rows?.length) {
        return {};
      }
      const obj = Object.create(null);

      for (let index = 0; index < data.rows.length; index++) {
        const item = data.rows[index];
        const arr = item.symbol.split("_");
        obj[item.symbol] = {
          ...item,
          base: arr[1],
          quote: arr[2],
          type: arr[0],
          name: `${arr[1]}-${arr[0]}`,
        };
      }

      return obj;
    },
  });

  return createGetter<API.SymbolExt>(data as API.SymbolExt);
};