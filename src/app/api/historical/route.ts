import { NextRequest, NextResponse } from "next/server";

export type HistoricalData = {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const coinId = searchParams.get("coinId");
  const days = searchParams.get("days") || "30"; // Default 30 days

  if (!coinId) {
    return NextResponse.json(
      { error: "coinId parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`[Historical API] Fetching ${days} days for ${coinId}`);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: HistoricalData = await response.json();
    
    console.log(`[Historical API] Success - Fetched ${data.prices.length} data points`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Historical API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}
