import { useQuery } from "../useQuery";
import { FundingRate } from "./useFundingRateBySymbol";
import { useEffect, useState } from "react";

/**
 * FundingRate
 * @param symbol
 */
export const useFundingRate = (symbol?: string) => {
  return useQuery<FundingRate>(`/public/funding_rate`);
};