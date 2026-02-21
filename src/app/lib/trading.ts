import { CoinMarket } from "./coingecko";

export type TradingStrategy = "day" | "swing" | "safe" | "all";

export type TradingRecommendation = {
  coin: CoinMarket;
  score: number;
  reasons: string[];
  strategy: TradingStrategy;
  metrics: {
    volumeScore: number;
    volatilityScore: number;
    trendScore: number;
    stabilityScore: number;
  };
};

// Calculate volume score (0-10) - higher volume = better liquidity
function calculateVolumeScore(volume: number, marketCap: number): number {
  const volumeToMarketCapRatio = volume / marketCap;
  if (volumeToMarketCapRatio > 0.3) return 10; // Very high volume
  if (volumeToMarketCapRatio > 0.2) return 8;
  if (volumeToMarketCapRatio > 0.1) return 6;
  if (volumeToMarketCapRatio > 0.05) return 4;
  return 2;
}

// Calculate volatility score (0-10) - moderate volatility is best for trading
function calculateVolatilityScore(priceChange: number | null): number {
  if (priceChange === null) return 0;
  const absChange = Math.abs(priceChange);
  
  // Best range: 2-8% change (good movement without extreme risk)
  if (absChange >= 2 && absChange <= 5) return 10;
  if (absChange > 5 && absChange <= 8) return 8;
  if (absChange > 8 && absChange <= 12) return 6;
  if (absChange > 12 && absChange <= 20) return 4;
  if (absChange > 20) return 2; // Too volatile
  return 5; // Too stable (< 2%)
}

// Calculate trend score (0-10) - positive momentum
function calculateTrendScore(priceChange: number | null): number {
  if (priceChange === null) return 5;
  
  // Slight positive bias for trading
  if (priceChange > 10) return 10; // Strong uptrend
  if (priceChange > 5) return 9;
  if (priceChange > 2) return 8;
  if (priceChange > 0) return 7;
  if (priceChange > -2) return 5; // Slight downtrend
  if (priceChange > -5) return 3;
  return 1; // Strong downtrend
}

// Calculate stability score (0-10) - based on market cap rank
function calculateStabilityScore(marketCapRank: number): number {
  if (marketCapRank <= 10) return 10; // Top 10 - very stable
  if (marketCapRank <= 25) return 8;
  if (marketCapRank <= 50) return 6;
  if (marketCapRank <= 100) return 4;
  return 2; // Lower cap - higher risk
}

// Generate recommendation reasons
function generateReasons(
  coin: CoinMarket,
  metrics: {
    volumeScore: number;
    volatilityScore: number;
    trendScore: number;
    stabilityScore: number;
  },
  strategy: TradingStrategy
): string[] {
  const reasons: string[] = [];
  
  // Volume reason
  if (metrics.volumeScore >= 8) {
    reasons.push(`High volume (${formatCompact(coin.total_volume)}) - Excellent liquidity for easy entry/exit`);
  } else if (metrics.volumeScore >= 6) {
    reasons.push(`Good volume (${formatCompact(coin.total_volume)}) - Sufficient liquidity`);
  }
  
  // Volatility reason
  if (metrics.volatilityScore >= 8) {
    reasons.push(`Optimal volatility (${formatPercent(coin.price_change_percentage_24h)}) - Good movement for trading`);
  } else if (metrics.volatilityScore >= 6) {
    reasons.push(`Moderate volatility - Manageable risk level`);
  }
  
  // Trend reason
  if (metrics.trendScore >= 8) {
    reasons.push(`Strong upward momentum (${formatPercent(coin.price_change_percentage_24h)}) - Bullish trend`);
  } else if (metrics.trendScore >= 6) {
    reasons.push(`Positive momentum - Trending upward`);
  } else if (metrics.trendScore <= 3) {
    reasons.push(`Potential reversal opportunity - Oversold conditions`);
  }
  
  // Stability reason
  if (metrics.stabilityScore >= 8) {
    reasons.push(`Top ${coin.market_cap_rank} market cap - Lower manipulation risk`);
  } else if (metrics.stabilityScore >= 6) {
    reasons.push(`Established project - Moderate stability`);
  }
  
  // Strategy-specific reasons
  switch (strategy) {
    case "day":
      reasons.push("Day trading pick - High liquidity with intraday movement");
      break;
    case "swing":
      reasons.push("Swing trade setup - Trend momentum with volume support");
      break;
    case "safe":
      reasons.push("Conservative choice - Large cap with steady performance");
      break;
  }
  
  return reasons.slice(0, 4); // Limit to 4 reasons
}

// Format helpers
function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(value)}%`;
}

// Get recommendation for a specific strategy
export function getRecommendation(
  coins: CoinMarket[],
  strategy: TradingStrategy
): TradingRecommendation | null {
  if (coins.length === 0) return null;
  
  let filteredCoins = coins;
  
  // Filter based on strategy
  switch (strategy) {
    case "day":
      // Day trading: High volume, moderate volatility, any trend
      filteredCoins = coins.filter(c => 
        c.total_volume > 100000000 && // $100M+ volume
        c.market_cap_rank <= 50 && // Top 50 only
        Math.abs(c.price_change_percentage_24h || 0) > 1 // Some movement
      );
      break;
    case "swing":
      // Swing trading: Strong trend, good volume
      filteredCoins = coins.filter(c => 
        c.total_volume > 50000000 && // $50M+ volume
        c.market_cap_rank <= 100 && // Top 100
        Math.abs(c.price_change_percentage_24h || 0) > 2 // Clear trend
      );
      break;
    case "safe":
      // Safe picks: Large cap, stable, positive trend
      filteredCoins = coins.filter(c => 
        c.market_cap_rank <= 25 && // Top 25 only
        (c.price_change_percentage_24h || 0) > -5 // Not crashing
      );
      break;
    case "all":
    default:
      filteredCoins = coins.filter(c => c.market_cap_rank <= 100);
  }
  
  if (filteredCoins.length === 0) {
    // Fallback to top 10 if no matches
    filteredCoins = coins.slice(0, 10);
  }
  
  // Score each coin
  const scoredCoins = filteredCoins.map(coin => {
    const volumeScore = calculateVolumeScore(coin.total_volume, coin.market_cap);
    const volatilityScore = calculateVolatilityScore(coin.price_change_percentage_24h);
    const trendScore = calculateTrendScore(coin.price_change_percentage_24h);
    const stabilityScore = calculateStabilityScore(coin.market_cap_rank);
    
    // Weighted total score
    const score = 
      volumeScore * 0.3 +      // 30% - Liquidity is crucial
      volatilityScore * 0.25 + // 25% - Movement opportunity
      trendScore * 0.25 +      // 25% - Direction matters
      stabilityScore * 0.2;    // 20% - Risk management
    
    return {
      coin,
      score,
      metrics: {
        volumeScore,
        volatilityScore,
        trendScore,
        stabilityScore,
      },
    };
  });
  
  // Sort by score descending
  scoredCoins.sort((a, b) => b.score - a.score);
  
  const best = scoredCoins[0];
  
  return {
    coin: best.coin,
    score: Math.round(best.score * 10) / 10, // Round to 1 decimal
    reasons: generateReasons(best.coin, best.metrics, strategy),
    strategy,
    metrics: best.metrics,
  };
}

// Get all strategy recommendations
export function getAllRecommendations(coins: CoinMarket[]): {
  day: TradingRecommendation | null;
  swing: TradingRecommendation | null;
  safe: TradingRecommendation | null;
  bestOverall: TradingRecommendation | null;
} {
  const day = getRecommendation(coins, "day");
  const swing = getRecommendation(coins, "swing");
  const safe = getRecommendation(coins, "safe");
  
  // Best overall is the highest scored recommendation
  const allRecs = [day, swing, safe].filter((r): r is TradingRecommendation => r !== null);
  const bestOverall = allRecs.length > 0 
    ? allRecs.sort((a, b) => b.score - a.score)[0]
    : null;
  
  return {
    day,
    swing,
    safe,
    bestOverall,
  };
}

// Calculate viability score (0-100) for any coin
export function calculateViability(coin: CoinMarket): {
  score: number;
  liquidity: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
  signal: "buy" | "hold" | "avoid";
  reasons: string[];
} {
  const volumeScore = calculateVolumeScore(coin.total_volume, coin.market_cap);
  const volatilityScore = calculateVolatilityScore(coin.price_change_percentage_24h);
  const trendScore = calculateTrendScore(coin.price_change_percentage_24h);
  const stabilityScore = calculateStabilityScore(coin.market_cap_rank);
  
  // Overall viability score (0-100)
  const score = Math.round(
    (volumeScore * 0.25 + volatilityScore * 0.25 + trendScore * 0.25 + stabilityScore * 0.25) * 10
  );
  
  // Liquidity level
  let liquidity: "high" | "medium" | "low";
  if (volumeScore >= 8) liquidity = "high";
  else if (volumeScore >= 5) liquidity = "medium";
  else liquidity = "low";
  
  // Risk level
  let risk: "low" | "medium" | "high";
  if (stabilityScore >= 8) risk = "low";
  else if (stabilityScore >= 5) risk = "medium";
  else risk = "high";
  
  // Trading signal
  let signal: "buy" | "hold" | "avoid";
  if (score >= 75 && trendScore >= 7) signal = "buy";
  else if (score >= 50 && trendScore >= 5) signal = "hold";
  else signal = "avoid";
  
  // Generate reasons
  const reasons: string[] = [];
  
  if (score >= 80) reasons.push("Excellent overall metrics for trading");
  else if (score >= 60) reasons.push("Good trading potential with manageable risk");
  else if (score >= 40) reasons.push("Moderate viability - proceed with caution");
  else reasons.push("Poor trading conditions - high risk");
  
  if (liquidity === "high") reasons.push("High liquidity ensures easy entry/exit");
  else if (liquidity === "low") reasons.push("Low liquidity - slippage risk");
  
  if (risk === "low") reasons.push("Large cap stability reduces manipulation risk");
  else if (risk === "high") reasons.push("High volatility - only for risk-tolerant traders");
  
  if (signal === "buy") reasons.push("Strong buy signal - positive momentum");
  else if (signal === "avoid") reasons.push("Avoid - unfavorable market conditions");
  
  return {
    score,
    liquidity,
    risk,
    signal,
    reasons: reasons.slice(0, 3),
  };
}

// Get liquidity label with emoji
export function getLiquidityLabel(level: "high" | "medium" | "low"): string {
  const labels = {
    high: "High 🔥",
    medium: "Med ⚡",
    low: "Low ❄️",
  };
  return labels[level];
}

// Get risk label with color indicator
export function getRiskLabel(level: "low" | "medium" | "high"): string {
  const labels = {
    low: "Low 🟢",
    medium: "Med 🟡",
    high: "High 🔴",
  };
  return labels[level];
}

// Get signal label with styling hint
export function getSignalLabel(signal: "buy" | "hold" | "avoid"): string {
  const labels = {
    buy: "Buy 🚀",
    hold: "Hold ⏸️",
    avoid: "Avoid 🛑",
  };
  return labels[signal];
}

// Get top 5 coins for a specific strategy
export function getTopFive(
  coins: CoinMarket[],
  strategy: TradingStrategy
): TradingRecommendation[] {
  if (coins.length === 0) return [];
  
  let filteredCoins = coins;
  
  // Filter based on strategy
  switch (strategy) {
    case "day":
      filteredCoins = coins.filter(c => 
        c.total_volume > 100000000 &&
        c.market_cap_rank <= 50 &&
        Math.abs(c.price_change_percentage_24h || 0) > 1
      );
      break;
    case "swing":
      filteredCoins = coins.filter(c => 
        c.total_volume > 50000000 &&
        c.market_cap_rank <= 100 &&
        Math.abs(c.price_change_percentage_24h || 0) > 2
      );
      break;
    case "safe":
      filteredCoins = coins.filter(c => 
        c.market_cap_rank <= 25 &&
        (c.price_change_percentage_24h || 0) > -5
      );
      break;
    case "all":
    default:
      filteredCoins = coins.filter(c => c.market_cap_rank <= 100);
  }
  
  if (filteredCoins.length === 0) {
    filteredCoins = coins.slice(0, 10);
  }
  
  // Score each coin
  const scoredCoins = filteredCoins.map(coin => {
    const volumeScore = calculateVolumeScore(coin.total_volume, coin.market_cap);
    const volatilityScore = calculateVolatilityScore(coin.price_change_percentage_24h);
    const trendScore = calculateTrendScore(coin.price_change_percentage_24h);
    const stabilityScore = calculateStabilityScore(coin.market_cap_rank);
    
    const score = 
      volumeScore * 0.3 +
      volatilityScore * 0.25 +
      trendScore * 0.25 +
      stabilityScore * 0.2;
    
    return {
      coin,
      score: Math.round(score * 10) / 10,
      metrics: {
        volumeScore,
        volatilityScore,
        trendScore,
        stabilityScore,
      },
    };
  });
  
  // Sort by score descending and take top 5
  scoredCoins.sort((a, b) => b.score - a.score);
  
  return scoredCoins.slice(0, 5).map(item => ({
    coin: item.coin,
    score: item.score,
    reasons: generateReasons(item.coin, item.metrics, strategy),
    strategy,
    metrics: item.metrics,
  }));
}

// Calculate Simple Moving Average
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial averages
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 10) / 10;
}

// Get technical indicators for a price series
export function getTechnicalIndicators(prices: number[]): {
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  trend: "bullish" | "bearish" | "neutral";
} {
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const rsi = calculateRSI(prices, 14);
  
  // Determine trend based on moving averages
  let trend: "bullish" | "bearish" | "neutral" = "neutral";
  if (sma50 && sma200) {
    if (sma50 > sma200) trend = "bullish";
    else if (sma50 < sma200) trend = "bearish";
  }
  
  return {
    sma50,
    sma200,
    rsi,
    trend,
  };
}

// Get all top 5 recommendations
export function getAllTopFive(coins: CoinMarket[]): {
  day: TradingRecommendation[];
  swing: TradingRecommendation[];
  safe: TradingRecommendation[];
} {
  return {
    day: getTopFive(coins, "day"),
    swing: getTopFive(coins, "swing"),
    safe: getTopFive(coins, "safe"),
  };
}
