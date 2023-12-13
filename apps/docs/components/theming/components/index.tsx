import { Card } from "./card";
import { OrderBookComponent } from "./orderbook";
import { OrderEntryComponent } from "@/components/theming/components/orderEntry";
import { DepositComponent } from "@/components/theming/components/deposit";

import { WithdrawComponent } from "./withdraw";
import { MarketsComponent } from "./markets";
import { WalletConnector } from "./walletConnector";
import { TradeHistoryComponent } from "./tradeHistory";
import { Orders } from "./orders";
import { AccountStatusBarComponent } from "./accountStateBar";
import { AssetsComponent } from "./assets";
import { ClosePositionPaneComponent } from "./closePositionPane";
import { ThemeEditor } from "../editor";
import { ChainListComponent } from "./chainlist";

const Components = () => {
  return (
    <div className="grid grid-cols-4 gap-5">
      <div className="space-y-5">
        <Card>
          <MarketsComponent />
        </Card>
        <Card>
          <Orders />
        </Card>
        <Card>
          <AssetsComponent />
        </Card>
      </div>
      <div className="space-y-5">
        <Card>
          <OrderBookComponent />
        </Card>
        <Card>
          <DepositComponent />
        </Card>
        <Card>
          <TradeHistoryComponent />
        </Card>
        <Card>
          <ClosePositionPaneComponent />
        </Card>
      </div>
      <div className="space-y-5">
        <Card>
          <OrderEntryComponent />
        </Card>
        <Card>
          <WithdrawComponent />
        </Card>
        <Card>
          <WalletConnector />
        </Card>
        <Card>
          <AccountStatusBarComponent />
        </Card>
        <Card>
          <ChainListComponent />
        </Card>
      </div>
      <div>
        <ThemeEditor />
      </div>
    </div>
  );
};

export default Components;