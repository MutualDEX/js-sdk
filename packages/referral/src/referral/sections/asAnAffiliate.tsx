import { Button, Numeral } from "@orderly.network/react";
import { ReferralIcon } from "../icons/referral";
import { useContext, useMemo } from "react";
import { ReferralContext } from "../../hooks/referralContext";
import { USDCIcon } from "../../affiliate/icons";
import { ArrowRightIcon } from "../icons/arrowRight";
import { commify } from "@orderly.network/utils";
import { refCommify } from "../../utils/decimal";


export const AsAnAffiliate = () => {

  const { referralInfo, isAffiliate, becomeAnAffiliate, becomeAnAffiliateUrl, enterAffiliatePage } = useContext(ReferralContext);

  const onClickAffiliate = () => {
    if (becomeAnAffiliate) {
      becomeAnAffiliate?.();
    } else if (becomeAnAffiliateUrl) {
      window.open(becomeAnAffiliateUrl, "__blank");
    }
  };

  const bottomInfo = useMemo(() => {
    const totalReferrerRebate = referralInfo?.referrer_info?.total_referrer_rebate;

    if (isAffiliate) {
      return (
        <div className="orderly-mt-3 orderly-text-[24px] lg:orderly-txt-[26px] 2xl:orderly-text-[30[px] orderly-flex orderly-justify-between orderly-items-end">
          <div>
            <div className="orderly-text-xs md:orderly-text-base 2xl:orderly-text-[18px] orderly-text-base-contrast-80">Commission (USDC)</div>
            <div className="orderly-flex-1 orderly-flex orderly-items-center orderly-mt-3">
              <div className="orderly-mr-3 orderly-w-[28px] orderly-h-[28px] xl:orderly-w-[32px] xl:orderly-h-[32px] 2xl:orderly-w-[36px] 2xl:orderly-h-[36px]">
                <USDCIcon width={"100%"} height={"100%"} />
              </div>
              <Numeral >{(totalReferrerRebate || 0)}</Numeral>
            </div>
          </div>

          <button onClick={() => enterAffiliatePage?.({ tab: 0 })} className="orderly-flex orderly-items-center orderly-text-xs md:orderly-text-base 2xl:orderly-text-lg orderly-gap-2">
            Enter
            <ArrowRightIcon fill="white" fillOpacity={0.98} />
          </button>
        </div>
      );
    }


    return (
      <div className="orderly-flex orderly-justify-between orderly-mt-2 orderly-items-center">
        <Button
          id="referral_become_an_affiliate_btn"
          onClick={onClickAffiliate}
          className="orderly-bg-white orderly-text-[#282E3A] xl:orderly-text-lg 2xl:orderly-text-lg orderly-px-3 orderly-h-[44px] xl:orderly-h-[54px]"
        >
          Become an affiliate
        </Button>

        <div>
          <div className="orderly-text-[22px] md:orderly-text-[24px] lg:orderly-text-[26px] xl:orderly-text-[26px] 2xl:orderly-text-[28px]">40%~60%</div>
          <div className="orderly-text-3xs 2xl:orderly-text-xs orderly-text-right orderly-text-base-contrast-54">Commission</div>
        </div>
      </div>
    );

  }, [referralInfo?.referrer_info?.total_referrer_rebate, isAffiliate]);

  return (
    <div
      id="dashboard_affiliate_container"
      className="orderly-rounded-xl orderly-w-full orderly-p-6 orderly-bg-gradient-to-t orderly-from-referral-bg-from orderly-to-referral-bg-to orderly-h-[195px] lg:orderly-h-[199px] xl:orderly-h-[216px] 2xl:orderly-h-[248px] orderly-flex orderly-flex-col orderly-justify-between"
    >
      <div className="orderly-flex orderly-justify-between orderly-relative">
        <div className="orderly-justify-between orderly-max-w-[211px] md:orderly-max-w-[310px] lg:orderly-max-w-[480px] xl:orderly-max-w-[264px] 2xl:orderly-max-w-[282px]">
          <div className="orderly-text-2xl lg:orderly-text-[26px] xl:orderly-text-[28px] 2xl:orderly-text-[30px]">{isAffiliate ? 'Affiliate' : 'As an affiliate'}</div>
          {!isAffiliate && <div className="orderly-mt-6 orderly-text-2xs lg:orderly-text-xs md:orderly-text-xs xl:orderly-text-xs 2xl:orderly-text-base orderly-text-base-contrast-54">
            Onboard traders to earn passive income
          </div>}
        </div>
        <ReferralIcon className="orderly-absolute orderly-top-0 orderly-right-0 orderly-w-[72px] orderly-h-[72px] lg:orderly-w-[64px] lg:orderly-h-[64px] xl:orderly-w-[90px] xl:orderly-h-[90px] 2xl:orderly-w-[120px] 2xl:orderly-h-[120px]" />
      </div>

      {bottomInfo}

    </div>
  );
};
