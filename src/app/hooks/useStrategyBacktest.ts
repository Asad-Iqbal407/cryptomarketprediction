"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STRATEGY_TIMEFRAMES, StrategyTimeframe } from "../lib/strategyPlaybook";
import {
  HistoricalChartData,
  STRATEGY_TIMEFRAME_DAYS,
  StrategyBacktestResult,
  buildSeriesForTimeframe,
  runBacktestForAllStrategies,
} from "../lib/strategyBacktest";

type BacktestState = {
  results: Record<string, StrategyBacktestResult>;
  isLoading: boolean;
  error: string | null;
  fetchedAt: string;
};

async function fetchHistorical(
  coinId: string,
  days: string
): Promise<HistoricalChartData> {
  const response = await fetch(`/api/historical?coinId=${coinId}&days=${days}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Historical API error: ${response.status}`);
  }

  return data as HistoricalChartData;
}

export function useStrategyBacktest(coinId: string) {
  const [state, setState] = useState<BacktestState>({
    results: {},
    isLoading: true,
    error: null,
    fetchedAt: "",
  });
  const requestIdRef = useRef(0);

  const computeBacktest = useCallback(async () => {
    if (!coinId) {
      setState({
        results: {},
        isLoading: false,
        error: "Missing coin id",
        fetchedAt: "",
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((previous) => ({
      ...previous,
      isLoading: true,
      error: null,
    }));

    try {
      const entries = await Promise.all(
        STRATEGY_TIMEFRAMES.map(async (timeframe) => {
          const historical = await fetchHistorical(
            coinId,
            STRATEGY_TIMEFRAME_DAYS[timeframe]
          );
          return [timeframe, historical] as const;
        })
      );

      if (requestId !== requestIdRef.current) return;

      const seriesByTimeframe = entries.reduce<
        Record<StrategyTimeframe, ReturnType<typeof buildSeriesForTimeframe>>
      >(
        (acc, [timeframe, historical]) => {
          acc[timeframe] = buildSeriesForTimeframe(timeframe, historical);
          return acc;
        },
        {
          "15m": [],
          "4h": [],
          "1d": [],
          "1w": [],
        }
      );

      const results = runBacktestForAllStrategies(seriesByTimeframe);
      setState({
        results,
        isLoading: false,
        error: null,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const message =
        error instanceof Error ? error.message : "Failed to compute strategy backtests";
      setState((previous) => ({
        ...previous,
        isLoading: false,
        error: message,
      }));
    }
  }, [coinId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void computeBacktest();
    }, 0);

    return () => clearTimeout(timer);
  }, [computeBacktest]);

  return {
    ...state,
    refresh: computeBacktest,
  };
}
