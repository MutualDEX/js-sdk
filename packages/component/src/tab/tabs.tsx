import React, { Fragment, ReactNode, useEffect, useState } from "react";
import { FC, PropsWithChildren, useMemo } from "react";
import { Tab, TabProps } from "./tab";
import { TabPaneProps } from "./tabPane";
import { TabBarExtraRender, TabItem, TabList } from "./tabList";
import { TabContextProvider } from "./tabContext";
import { TabContent } from "./tabContent";

export interface TabsProps {
  value?: string;
  onTabChange?: (value: string) => void;
  tabBarExtra?: ReactNode | TabBarExtraRender;
  keepAlive?: boolean;
}

// it's controlled component;
export const Tabs: FC<PropsWithChildren<TabsProps>> = (props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const [tabList, children] = useMemo(() => {
    const tabList: TabItem[] = [],
      children: ReactNode[] = [];
    React.Children.forEach(props.children, (child, index) => {
      const childElement = child as React.FunctionComponentElement<
        PropsWithChildren<TabPaneProps>
      >;
      const { displayName } = childElement.type;
      //   console.log(displayName, childElement);
      if (displayName === "TabPane") {
        //   return childElement;
        const { title, value, disabled } = childElement.props;
        const active = value === props.value;

        tabList.push({ title, value, disabled });

        children.push(
          <Fragment key={index}>{childElement.props.children}</Fragment>
        );

        // set active index
        if (active) {
          setActiveIndex(index);
        }
      } else {
        console.error(
          "Warning: Tabs has a child which is not a TabPane component"
        );
      }
    });

    return [tabList, children];
  }, [props.children]);

  useEffect(() => {
    const index = tabList.findIndex((tab) => {
      return tab.value === props.value;
    });

    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [props.value, tabList]);

  const child = useMemo(() => {
    return children[activeIndex];
  }, [children, activeIndex]);

  //   const extraNode

  return (
    <TabContextProvider>
      <div>
        <TabList
          tabs={tabList}
          onTabChange={props.onTabChange}
          value={props.value}
          tabBarExtra={props.tabBarExtra}
        />
        <TabContent>{child}</TabContent>
      </div>
    </TabContextProvider>
  );
};