import { useMediaQuery } from "@orderly.network/hooks";
import { Column, Divider, ListView, Statistic, Table, cn } from "@orderly.network/react";
import { FC, useCallback, useMemo } from "react";
import { MEDIA_LG, MEDIA_MD, MEDIA_SM } from "../../types/constants";
import { useRefereeInfo } from "../../hooks/useRefereeInfo";
import { formatTime, formatYMDTime } from "../../utils/utils";
import { API } from "../../types/api";

export const RefereesList: FC<{
    dateText?: string,
    setDateText: any
}> = (props) => {

    const [dataSource, { loadMore, refresh, isLoading }] = useRefereeInfo({});

    const isMD = useMediaQuery(MEDIA_MD);
    const { dateText, setDateText } = props;

    if (dataSource?.length > 0) {
        const text = formatTime(dataSource[0].update_time);
        if (text) {
            setDateText(text);
        }
    }

    return isMD ?
        <_SmallReferees date={dateText} dataSource={dataSource} loadMore={loadMore} /> :
        <_BigReferees dataSource={dataSource} />
}

const _SmallReferees: FC<{
    date?: string,
    dataSource?: API.RefereeInfoItem[],
    loadMore: any,
}> = (props) => {

    const { date, dataSource, loadMore } = props;
    // const content = useMemo(() => {
    //     if (dataSource.length === 0) {
    //         return (<EmptyView />);
    //     }

    //     return dataSource.map(() => <RefereesCell address="0x8Dd04...b1b88" code="$1,233.22" vol="2222" totalCommission="	$1,153.64" />);
    // }, [dataSource]);

    const renderItem = (item: any, index: number) => {
        const date = formatYMDTime(item?.code_binding_time);
        const addres = item?.use_address;
        const code = item?.referral_code;
        const vol = item?.volume;
        const totalCommission = item?.referral_rebate;
        return <RefereesCell address={addres} code={code} vol={vol} totalCommission={totalCommission} invicationTime={date || ""} />;
    };
    return (

        <div className="orderly-h-[197px] orderly-overflow-auto">
            <div className="orderly-mt-1 orderly-px-4 orderly-py-2 sm:orderly-flex orderly-items-center md:orderly-hidden orderly-text-3xs orderly-text-base-contrast-36">{date}</div>
            <ListView
                dataSource={dataSource}
                loadMore={loadMore}
                renderItem={renderItem}
            />
        </div>
    );
}

const _BigReferees: FC<{
    dataSource: any[]
}> = (props) => {
    const { dataSource } = props;

    const columns = useMemo<Column[]>(() => {
        return [
            {
                title: "Referee address",
                dataIndex: "date",
                className: "orderly-h-[64px]",

                render: (value, record) => (
                    <div className="orderly-flex orderly-gap-2 orderly-items-center">
                        0x8Dd04...b1b88
                    </div>
                )
            },
            {
                title: "Referral code",
                dataIndex: "Referees",
                align: "left",
                className: "orderly-h-[64px]",
                render: (value, record) => (
                    <div>
                        Carbo
                    </div>
                )
            },
            {
                title: "Total commission (USDC)",
                dataIndex: "vol",
                className: "orderly-h-[64px]",
                align: "right",
                render: (value, record) => (
                    <div >
                        $1,153.64
                    </div>
                )
            },
            {
                title: "Total vol. (USDC)",
                dataIndex: "vol",
                className: "orderly-h-[64px]",
                align: "right",
                render: (value, record) => (
                    <div >
                        $1,153.64
                    </div>
                )
            },
            {
                title: "Invication Time",
                dataIndex: "vol",
                className: "orderly-h-[64px]",
                align: "right",
                render: (value, record) => (
                    <div >
                        $1,153.64
                    </div>
                )
            },
        ];
    }, []);

    return (
        <div className="orderly-h-[300px] orderly-overflow-y-auto orderly-mt-4 orderly-px-3">
            <Table
                bordered
                justified
                showMaskElement={false}
                columns={columns}
                dataSource={dataSource}
                headerClassName="orderly-text-2xs orderly-text-base-contrast-54 orderly-py-3 orderly-bg-base-900 orderly-sticky orderly-top-0"
                className={cn(
                    "orderly-text-xs 2xl:orderly-text-base",
                )}
                generatedRowKey={(rec, index) => `${index}`}
            />
        </div>
    );
}

export const RefereesCell: FC<{
    address: string,
    code: string,
    totalCommission: string,
    vol: string,
    invicationTime: string,
}> = (props) => {

    const { address, code, vol, totalCommission, invicationTime } = props;

    const isSM = useMediaQuery(MEDIA_SM);

    console.log("ssss is SM", isSM);

    const buildNode = useCallback((
        label: string,
        value: any,
        className?: string,
        rule?: string,
        align?: "left" | "right" | "center"
    ) => {

        return (
            <Statistic
                label={label}
                labelClassName="orderly-text-3xs orderly-text-base-contrast-36"
                value={value}
                valueClassName="orderly-mt-1 orderly-text-2xs md:orderly-text-xs orderly-text-base-contrast-80"
                rule={rule}
                className={className}
                align={align}
            />
        );
    }, []);

    if (isSM) {
        return <div className="orderly-my-3 orderly-px-4 orderly-grid orderly-gap-2 orderly-grid-cols-2">
            {buildNode("Referee address", address, "orderly-col-span-1", "text")}
            {buildNode("Referee code", code, "orderly-col-span-1", "text", "right")}
            {buildNode("Total commission (USDC)", totalCommission, "orderly-col-span-1", "price")}
            {buildNode("Total vol. (USDC)", vol, "orderly-col-span-1", "price", "right")}
            {buildNode("Invication time", invicationTime, "orderly-col-span-1", "text")}
        </div>
    }


    return (
        <div className="orderly-my-3 orderly-px-4">
            <div className="orderly-flex">
                {buildNode("Referee address", address, "orderly-w-[159px]", "text")}
                {buildNode("Referee code", code, "orderly-flex-1", "text", "right")}
                {buildNode("Total commission (USDC)", totalCommission, "orderly-w-[159px]", "price", "right")}
            </div>
            <div className="orderly-flex orderly-mt-3">
                {buildNode("Total vol. (USDC)", vol, "orderly-w-[159px]", "price",)}
                {buildNode("Invication time", invicationTime, "orderly-col-span-1", "text", "right")}
            </div>
            <Divider className="orderly-mt-3" />
        </div>
    );
}