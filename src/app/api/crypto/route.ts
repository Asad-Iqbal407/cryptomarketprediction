import { NextResponse } from "next/server";

export type CoinMarket = {
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

const API_URL = "https://api.coingecko.com/api/v3/coins/markets";

// Simple in-memory cache to reduce API calls
let cache: {
  data: CoinMarket[];
  timestamp: number;
  fetchedAt: string;
} | null = null;

const CACHE_DURATION = 30000; // 30 seconds cache

// Track last request time to implement client-side rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "100";

  try {
    console.log(`[API] Fetching from CoinGecko with limit: ${limit}`);

    // Check cache first
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_DURATION) {
      console.log(`[API] Returning cached data (${cache.data.length} coins)`);
      return NextResponse.json({
        coins: cache.data,
        fetchedAt: cache.fetchedAt,
      });
    }

    // Client-side rate limiting
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`[API] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
    
    const params = new URLSearchParams({
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: limit,
      page: "1",
      sparkline: "false",
      price_change_percentage: "24h",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    console.log(`[API] CoinGecko response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] CoinGecko error: ${response.status} - ${errorText}`);
      
      // If we have cached data, return it even if stale
      if (cache) {
        console.log(`[API] Returning stale cache due to API error`);
        return NextResponse.json({
          coins: cache.data,
          fetchedAt: cache.fetchedAt,
          stale: true,
          error: `API error ${response.status}: Using cached data`,
        });
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded. CoinGecko's free tier allows limited requests. Please wait 30-60 seconds and try again.",
            retryAfter: 30 
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `CoinGecko API error: ${response.status}` },
        { status: response.status }
      );
    }

    const coins = (await response.json()) as CoinMarket[];
    const fetchedAt = new Date().toISOString();
    
    // Update cache
    cache = {
      data: coins,
      timestamp: Date.now(),
      fetchedAt,
    };
    
    console.log(`[API] Success - Fetched ${coins.length} coins`);
    
    return NextResponse.json({
      coins,
      fetchedAt,
    });
  } catch (error) {
    let message = "Unknown error";
    let errorType = "Unknown";
    
    if (error instanceof Error) {
      message = error.message;
      errorType = error.name;
      
      if (error.name === "AbortError") {
        message = "Request timeout - API took too long to respond";
      }
      
      console.error(`[API] Error Type: ${errorType}`);
      console.error(`[API] Error Message: ${message}`);
    }
    
    // Return cached data on error if available
    if (cache) {
      return NextResponse.json({
        coins: cache.data,
        fetchedAt: cache.fetchedAt,
        stale: true,
        error: `Network error: Using cached data`,
      });
    }
    
    return NextResponse.json(
      { error: `Failed to fetch: ${message}` },
      { status: 500 }
    );
  }
}
