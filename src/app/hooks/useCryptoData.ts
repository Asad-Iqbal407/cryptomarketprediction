"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCachedCoins,
  setCachedCoins,
  CoinMarket,
} from "../lib/coingecko";

async function getTopCoins(limit: number = 100): Promise<{
  coins: CoinMarket[];
  fetchedAt: string;
  stale?: boolean;
  error?: string;
}> {
  const response = await fetch(`/api/crypto?limit=${limit}`);
  
  const data = await response.json();
  
  if (!response.ok && !data.coins) {
    throw new Error(data.error || `API error: ${response.status}`);
  }
  
  // Return data even if stale (API returned cached data during error)
  return data;
}


type CryptoDataState = {
  coins: CoinMarket[];
  fetchedAt: string;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
};

const REFRESH_INTERVAL = 60000; // 60 seconds

export function useCryptoData(limit: number = 100) {
  const [state, setState] = useState<CryptoDataState>({
    coins: [],
    fetchedAt: "",
    isLoading: true,
    error: null,
    isRefreshing: false,
  });

  const fetchData = useCallback(
    async (isBackgroundRefresh: boolean = false) => {
      if (!isBackgroundRefresh) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      } else {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      try {
        // Check cache first for initial load
        if (!isBackgroundRefresh) {
          const cached = getCachedCoins();
          if (cached) {
            setState({
              coins: cached.coins,
              fetchedAt: cached.fetchedAt,
              isLoading: false,
              error: null,
              isRefreshing: false,
            });
            return;
          }
        }

        const result = await getTopCoins(limit);
        
        // Update cache
        setCachedCoins(result.coins, result.fetchedAt);
        
        setState({
          coins: result.coins,
          fetchedAt: result.fetchedAt,
          isLoading: false,
          error: null,
          isRefreshing: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        
        // Check if it's a rate limit error
        const isRateLimit = message.includes("429") || message.includes("Rate limit");
        const userMessage = isRateLimit 
          ? "Rate limit reached. Please wait 30-60 seconds before refreshing."
          : message;
        
        // If we have cached data, show it with error
        const cached = getCachedCoins();
        if (cached && state.coins.length === 0) {
          setState({
            coins: cached.coins,
            fetchedAt: cached.fetchedAt,
            isLoading: false,
            error: `Using cached data. ${userMessage}`,
            isRefreshing: false,
          });
        } else if (cached) {
          // Keep existing coins but show error
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isRefreshing: false,
            error: userMessage,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isRefreshing: false,
            error: `Unable to load prices. ${userMessage}`,
          }));
        }
      }

    },
    [limit, state.coins.length]
  );

  // Initial fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchData]);

  // Background refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
}
