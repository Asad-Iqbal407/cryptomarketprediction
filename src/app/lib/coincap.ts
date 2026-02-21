export type CoinCapAsset = {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string | null;
  vwap24Hr: string | null;
  explorer: string | null;
};

export type CoinCapResponse = {
  data: CoinCapAsset[];
  timestamp: number;
};

const API_URL = "https://api.coincap.io/v2/assets";

export async function getTopCoins(limit: number = 100): Promise<{
  coins: CoinCapAsset[];
  fetchedAt: string;
}> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`CoinCap API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as CoinCapResponse;
    
    return {
      coins: data.data,
      fetchedAt: new Date(data.timestamp).toISOString(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error - unable to connect to CoinCap API. This may be due to CORS restrictions or network issues.");
  }
}


// Cache helper functions
const CACHE_KEY = "coincap_cache";
const CACHE_DURATION = 60000; // 60 seconds

export type CachedData = {
  coins: CoinCapAsset[];
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

export function setCachedCoins(coins: CoinCapAsset[], fetchedAt: string): void {
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
