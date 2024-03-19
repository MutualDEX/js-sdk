export declare namespace API {

    export interface ReferralInfo {
        referrer_info: Referrer,
        referee_info: Referee,
    }

    export type ReferralCode = {
        "code": string,
        "max_rebate_rate": number,
        "referee_rebate_rate": number,
        "referrer_rebate_rate": number,
        "total_invites": number,
        "total_traded": number
    }

    export type Referrer = {
        "total_invites": number,
        "total_traded": number,
        "total_referee_volume": number,
        "total_referee_fee": number,
        "referral_codes": ReferralCode[],
        "total_referrer_rebate": number,
        "1d_invites": number,
        "7d_invites": number,
        "30d_invites": number,
        "1d_traded": number,
        "7d_traded": number,
        "30d_traded": number,
        "1d_referee_volume": number,
        "7d_referee_volume": number,
        "30d_referee_volume": number,
        "1d_referee_fee": number,
        "7d_referee_fee": number,
        "30d_referee_fee": number,
        "1d_referrer_rebate": number,
        "7d_referrer_rebate": number,
        "30d_referrer_rebate": number
    }

    export type Referee = {
        "referer_code"?: string,
        "referee_rebate_rate": any,
        "1d_referee_rebate": number,
        "7d_referee_rebate": number,
        "30d_referee_rebate": number,
        "total_referee_rebate": number
    }

    export type RefereeInfoItem = {
        "account_id": string,
        "code_binding_time": number,
        "fee": number,
        "referral_code": string,
        "referral_rebate": number,
        "register_time": number,
        "trade_status": string,
        "user_address": string,
        "volume": number
      }
}