import Button from "@/button";
import { Select } from "@/select";
import { Statistic } from "@/statistic";
import { FC } from "react";
import { modal } from "@/modal";
import { Checkbox } from "@/checkbox";
import { Label } from "@/label";

export type AggregatedData = {
  unsettledPnL: number;
  unrealPnL: number;
  notional: number;
};

interface OverviewProps {
  onMarketCloseAll?: () => void;
  canCloseAll?: boolean;

  aggregated?: AggregatedData;

  showAllSymbol?: boolean;
  onShowAllSymbolChange?: (value: boolean) => void;
}

export const PositionOverview: FC<OverviewProps> = (props) => {
  const { aggregated } = props;
  const onMarketCloseAll = () => {
    modal
      .confirm({
        title: "Market Close All",
        content: "Are you sure you want to market close all positions?",
      })
      .then((res) => {
        if (res) {
          props.onMarketCloseAll?.();
        }
      });
  };
  return (
    <>
      <div className="flex justify-between bg-base-200 px-4 py-3">
        <Statistic
          label="Unreal. PnL"
          value={aggregated?.unrealPnL}
          coloring
          rule="price"
        />
        <Statistic label="Notional" value={aggregated?.notional} rule="price" />
        <Statistic
          label="Unsettled PnL"
          value={aggregated?.unsettledPnL}
          rule="price"
          coloring
          align="right"
        />
      </div>
      <div className="flex justify-between py-3 px-4 items-center">
        <div className={"flex items-center gap-2"}>
          <Checkbox
            id={"showAll"}
            checked={props.showAllSymbol}
            onCheckedChange={props.onShowAllSymbolChange}
          />
          <Label htmlFor={"showAll"} className={"text-base-contrast/60"}>
            Show all instruments
          </Label>
        </div>
        {/* <Button
          variant={"outlined"}
          size={"small"}
          color={"tertiary"}
          onClick={() => onMarketCloseAll()}
        >
          Market Close All
        </Button> */}
      </div>
    </>
  );
};