﻿export type CoinMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  ath: number;
  atl: number;
};

// Cache helper functions
const CACHE_KEY = "coingecko_cache";
const CACHE_DURATION = 60000; // 60 seconds

export type CachedData = {
  coins: CoinMarket[];
  fetchedAt: string;
  timestamp: number;
};

export function getCachedCoins(): CachedData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed;
    }
    
    return null;
  } catch {
    return null;
  }
}

export function setCachedCoins(coins: CoinMarket[], fetchedAt: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const cacheData: CachedData = {
      coins,
      fetchedAt,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearCache(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
