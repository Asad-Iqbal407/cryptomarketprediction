import {
  STRATEGY_LIBRARY,
  StrategyTemplate,
  StrategyTimeframe,
} from "./strategyPlaybook";

export type HistoricalChartData = {
  prices: [number, number][];
  total_volumes: [number, number][];
};

export type BacktestConfidence = "low" | "medium" | "high";

export type StrategyBacktestResult = {
  strategyId: string;
  timeframe: StrategyTimeframe;
  score: number;
  confidence: BacktestConfidence;
  winRate: number;
  trades: number;
  wins: number;
  losses: number;
  neutral: number;
  avgReturnPercent: number;
  expectancy: number;
  profitFactor: number;
  maxConsecutiveLosses: number;
  sampleNote: string;
};

type CandlePoint = {
  timestamp: number;
  close: number;
  volume: number;
};

const BUCKET_MS: Record<StrategyTimeframe, number> = {
  "15m": 15 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

export const STRATEGY_TIMEFRAME_DAYS: Record<StrategyTimeframe, string> = {
  "15m": "1",
  "4h": "30",
  "1d": "365",
  "1w": "1825",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.trunc(clamp(value, min, max));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calcRSI(closes: number[], index: number, period: number = 14): number | null {
  if (index < period) return null;
  let gains = 0;
  let losses = 0;

  for (let i = index - period + 1; i <= index; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

function aggregateToBucket(points: CandlePoint[], bucketMs: number): CandlePoint[] {
  if (points.length === 0) return [];

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const buckets: CandlePoint[] = [];

  let activeBucket = Math.floor(sorted[0].timestamp / bucketMs) * bucketMs;
  let close = sorted[0].close;
  let volume = sorted[0].volume;

  for (let i = 1; i < sorted.length; i++) {
    const point = sorted[i];
    const bucket = Math.floor(point.timestamp / bucketMs) * bucketMs;

    if (bucket !== activeBucket) {
      buckets.push({
        timestamp: activeBucket,
        close,
        volume,
      });
      activeBucket = bucket;
      close = point.close;
      volume = point.volume;
      continue;
    }

    close = point.close;
    volume += point.volume;
  }

  buckets.push({
    timestamp: activeBucket,
    close,
    volume,
  });

  return buckets;
}

export function buildSeriesForTimeframe(
  timeframe: StrategyTimeframe,
  historical: HistoricalChartData
): CandlePoint[] {
  const points: CandlePoint[] = historical.prices
    .map(([timestamp, close], index) => ({
      timestamp,
      close,
      volume: historical.total_volumes[index]?.[1] ?? 0,
    }))
    .filter((point) => Number.isFinite(point.close) && point.close > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  return aggregateToBucket(points, BUCKET_MS[timeframe]);
}

function getConfidence(timeframe: StrategyTimeframe, trades: number, resolved: number): BacktestConfidence {
  const thresholds: Record<StrategyTimeframe, { medium: number; high: number }> = {
    "15m": { medium: 24, high: 50 },
    "4h": { medium: 18, high: 36 },
    "1d": { medium: 12, high: 24 },
    "1w": { medium: 8, high: 16 },
  };

  const t = thresholds[timeframe];
  if (trades >= t.high && resolved >= Math.floor(t.high * 0.45)) return "high";
  if (trades >= t.medium && resolved >= Math.floor(t.medium * 0.45)) return "medium";
  return "low";
}

function emptyBacktest(strategy: StrategyTemplate, reason: string): StrategyBacktestResult {
  return {
    strategyId: strategy.id,
    timeframe: strategy.timeframe,
    score: 0,
    confidence: "low",
    winRate: 0,
    trades: 0,
    wins: 0,
    losses: 0,
    neutral: 0,
    avgReturnPercent: 0,
    expectancy: 0,
    profitFactor: 0,
    maxConsecutiveLosses: 0,
    sampleNote: reason,
  };
}

export function runBacktestForStrategy(
  strategy: StrategyTemplate,
  candles: CandlePoint[]
): StrategyBacktestResult {
  if (candles.length < 35) {
    return emptyBacktest(strategy, "Not enough historical candles for this timeframe.");
  }

  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);

  const lookback = clampInt(
    10 + strategy.volatilityMultiplier * 7 + strategy.targetWeights[1] * 2.2,
    10,
    strategy.timeframe === "1w" ? 26 : 34
  );

  const startIndex = Math.max(22, lookback + 1);

  let trades = 0;
  let wins = 0;
  let losses = 0;
  let neutral = 0;
  let cumulativeReturn = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winRRSum = 0;
  let winRRCount = 0;
  let lossRRSum = 0;
  let lossRRCount = 0;
  let maxConsecutiveLosses = 0;
  let consecutiveLosses = 0;

  for (let i = startIndex; i < closes.length - 1; i++) {
    const current = closes[i];
    const previous = closes[i - 1];
    const next = closes[i + 1];

    const window20 = closes.slice(i - 20, i + 1);
    const volumeWindow20 = volumes.slice(i - 20, i);
    const shortSMA = mean(closes.slice(i - 5, i + 1));
    const longSMA = mean(window20);
    const rangeWindow = closes.slice(i - lookback, i);
    const recentHigh = Math.max(...rangeWindow);
    const recentLow = Math.min(...rangeWindow);
    const currentStd = stdDev(window20);
    const zScore = currentStd > 0 ? (current - longSMA) / currentStd : 0;

    const returns20: number[] = [];
    for (let j = i - 19; j <= i; j++) {
      const base = closes[j - 1];
      if (base > 0) {
        returns20.push((closes[j] - base) / base);
      }
    }
    const volatility = clamp(stdDev(returns20), 0.0004, 0.25);

    const r1 = previous > 0 ? (current - previous) / previous : 0;
    const r3Base = closes[i - 3];
    const r3 = r3Base > 0 ? (current - r3Base) / r3Base : 0;
    const prevR3Base = closes[i - 4];
    const prevR3 = prevR3Base > 0 ? (previous - prevR3Base) / prevR3Base : r3;
    const avgVolume = mean(volumeWindow20);
    const volumeRatio = avgVolume > 0 ? volumes[i] / avgVolume : 1;
    const rsi = calcRSI(closes, i, 14) ?? 50;

    const breakoutMargin = volatility * (0.15 + strategy.targetWeights[0] * 0.08);
    const momentumThreshold = volatility * (0.8 + strategy.volatilityMultiplier * 0.45);

    let signal = false;
    switch (strategy.style) {
      case "trend":
        signal =
          current > shortSMA &&
          shortSMA >= longSMA * (1 - volatility * 0.2) &&
          r1 > -volatility * 0.15 &&
          volumeRatio > 0.8;
        break;
      case "breakout":
        signal = current > recentHigh * (1 + breakoutMargin) && volumeRatio > 0.9;
        break;
      case "momentum":
        signal = r3 > momentumThreshold && current > longSMA && volumeRatio > 0.85;
        break;
      case "reversal":
        signal =
          prevR3 < -momentumThreshold * 1.15 &&
          r1 > volatility * 0.05 &&
          current > recentLow * (1 + volatility * 0.25) &&
          rsi < 60;
        break;
      case "mean-reversion":
        signal =
          zScore < -(0.9 + strategy.stopBuffer * 1.3) &&
          r1 > -volatility * 0.1 &&
          rsi < 55;
        break;
      default:
        signal = false;
    }

    if (!signal) continue;

    trades += 1;
    const nextReturn = (next - current) / current;
    cumulativeReturn += nextReturn;
    if (nextReturn > 0) grossProfit += nextReturn;
    if (nextReturn < 0) grossLoss += Math.abs(nextReturn);

    const riskStep = clamp(
      volatility * (0.28 + strategy.stopBuffer * 0.4),
      0.00035,
      0.25
    );
    const rewardStep = clamp(
      riskStep * (0.85 + strategy.targetWeights[0] * 0.32),
      riskStep * 0.6,
      riskStep * 2.2
    );
    const rr = nextReturn / riskStep;

    if (nextReturn >= rewardStep) {
      wins += 1;
      consecutiveLosses = 0;
      winRRSum += rr;
      winRRCount += 1;
      continue;
    }

    if (nextReturn <= -riskStep) {
      losses += 1;
      consecutiveLosses += 1;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
      lossRRSum += Math.abs(rr);
      lossRRCount += 1;
      continue;
    }

    neutral += 1;
    consecutiveLosses = 0;
  }

  if (trades === 0) {
    return emptyBacktest(strategy, "No valid triggers found in the selected historical window.");
  }

  const resolved = wins + losses;
  const winRate = resolved > 0 ? wins / resolved : 0;
  const avgReturnPercent = (cumulativeReturn / trades) * 100;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 3 : 0;
  const avgWinRR = winRRCount > 0 ? winRRSum / winRRCount : 0;
  const avgLossRR = lossRRCount > 0 ? lossRRSum / lossRRCount : 1;
  const expectancy = resolved > 0 ? winRate * avgWinRR - (1 - winRate) * avgLossRR : 0;

  const timeframeSample: Record<StrategyTimeframe, number> = {
    "15m": 70,
    "4h": 55,
    "1d": 40,
    "1w": 24,
  };
  const sampleWeight = clamp(trades / timeframeSample[strategy.timeframe], 0.25, 1);

  const winScore = clamp(winRate, 0, 1) * 100;
  const expectancyScore = clamp((expectancy + 0.5) / 1.6, 0, 1) * 100;
  const pfScore = clamp(profitFactor / 2.2, 0, 1) * 100;
  const consistencyScore = clamp(1 - maxConsecutiveLosses / 10, 0, 1) * 100;
  const sampleScore = sampleWeight * 100;
  const score = Math.round(
    0.35 * winScore +
      0.25 * expectancyScore +
      0.2 * pfScore +
      0.1 * consistencyScore +
      0.1 * sampleScore
  );

  const confidence = getConfidence(strategy.timeframe, trades, resolved);
  const sampleNote =
    confidence === "low"
      ? `Limited sample (${trades} signals). Use this as guidance only.`
      : `Based on ${trades} historical signals on ${strategy.timeframe} candles.`;

  return {
    strategyId: strategy.id,
    timeframe: strategy.timeframe,
    score,
    confidence,
    winRate: winRate * 100,
    trades,
    wins,
    losses,
    neutral,
    avgReturnPercent,
    expectancy,
    profitFactor,
    maxConsecutiveLosses,
    sampleNote,
  };
}

export function runBacktestForAllStrategies(
  seriesByTimeframe: Record<StrategyTimeframe, CandlePoint[]>
): Record<string, StrategyBacktestResult> {
  return STRATEGY_LIBRARY.reduce<Record<string, StrategyBacktestResult>>(
    (result, strategy) => {
      result[strategy.id] = runBacktestForStrategy(
        strategy,
        seriesByTimeframe[strategy.timeframe] ?? []
      );
      return result;
    },
    {}
  );
}
