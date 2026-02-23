import { CoinMarket } from "./coingecko";

export type StrategyTimeframe = "15m" | "4h" | "1d" | "1w";
export type StrategyStyle =
  | "trend"
  | "breakout"
  | "momentum"
  | "reversal"
  | "mean-reversion";

type EntryMode = "market" | "pullback" | "breakout" | "reversal";

export type StrategyTemplate = {
  id: string;
  timeframe: StrategyTimeframe;
  name: string;
  style: StrategyStyle;
  description: string;
  reasoning?: string;
  entryRule: string;
  confirmationRule: string;
  stopLossRule: string;
  takeProfitRule: string;
  holdWindow: string;
  entryMode: EntryMode;
  volatilityMultiplier: number;
  supportWeights: [number, number];
  resistanceWeights: [number, number];
  stopBuffer: number;
  targetWeights: [number, number, number];
  checklist: string[];
};

export type StrategyPlan = {
  strategy: StrategyTemplate;
  timeframeLabel: string;
  executionWindow: string;
  executionGuidance: string;
  entryDistancePercent: number;
  currentPrice: number;
  rangePercent: number;
  dailyVolatilityPercent: number;
  entryPrice: number;
  supportPrimary: number;
  supportSecondary: number;
  resistancePrimary: number;
  resistanceSecondary: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  stopLossPercent: number;
  takeProfit1Percent: number;
  takeProfit2Percent: number;
  takeProfit3Percent: number;
  riskRewardRatio: number;
  maxRiskPercent: number;
  positionSizeHint: string;
  invalidationText: string;
};

export const STRATEGY_TIMEFRAMES: StrategyTimeframe[] = ["15m", "4h", "1d", "1w"];

const TIMEFRAME_CONFIG: Record<
  StrategyTimeframe,
  {
    label: string;
    frameMultiplier: number;
    minRange: number;
    maxRange: number;
    maxRiskPercent: number;
    maxEntryPremium: number;
    maxEntryDiscount: number;
    minRiskDistance: number;
    maxRiskDistance: number;
  }
> = {
  "15m": {
    label: "15 Minute",
    frameMultiplier: 0.45,
    minRange: 0.004,
    maxRange: 0.04,
    maxRiskPercent: 0.75,
    maxEntryPremium: 0.02,
    maxEntryDiscount: 0.02,
    minRiskDistance: 0.0025,
    maxRiskDistance: 0.012,
  },
  "4h": {
    label: "4 Hour",
    frameMultiplier: 0.9,
    minRange: 0.01,
    maxRange: 0.08,
    maxRiskPercent: 1,
    maxEntryPremium: 0.045,
    maxEntryDiscount: 0.04,
    minRiskDistance: 0.006,
    maxRiskDistance: 0.028,
  },
  "1d": {
    label: "Daily",
    frameMultiplier: 1.45,
    minRange: 0.02,
    maxRange: 0.12,
    maxRiskPercent: 1.25,
    maxEntryPremium: 0.07,
    maxEntryDiscount: 0.06,
    minRiskDistance: 0.011,
    maxRiskDistance: 0.045,
  },
  "1w": {
    label: "Weekly",
    frameMultiplier: 2.2,
    minRange: 0.04,
    maxRange: 0.22,
    maxRiskPercent: 1.5,
    maxEntryPremium: 0.09,
    maxEntryDiscount: 0.08,
    minRiskDistance: 0.018,
    maxRiskDistance: 0.075,
  },
};

export const STRATEGY_LIBRARY: StrategyTemplate[] = [
  {
    id: "15m-ema-pullback",
    timeframe: "15m",
    name: "9/21 EMA Pullback Scalping",
    style: "trend",
    description: "Trade fast pullbacks inside an intraday uptrend after reclaiming short EMAs.",
    entryRule: "Enter on a bullish candle close above 9 EMA after a pullback to the 21 EMA zone.",
    confirmationRule: "Volume must be above the 20-candle average and price should stay above VWAP.",
    stopLossRule: "Place stop below the pullback low or below 21 EMA invalidation.",
    takeProfitRule: "Scale at 1R and 2R, leave runner into session high retest.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "pullback",
    volatilityMultiplier: 0.9,
    supportWeights: [0.8, 1.4],
    resistanceWeights: [1, 1.9],
    stopBuffer: 0.32,
    targetWeights: [1, 1.8, 2.7],
    checklist: [
      "Trend aligned on 15m and 1h",
      "Pullback stays above prior swing low",
      "Reclaim candle closes with body strength",
    ],
  },
  {
    id: "15m-orb",
    timeframe: "15m",
    name: "Opening Range Breakout (ORB)",
    style: "breakout",
    description: "Capture expansion after the first intraday range breaks with momentum.",
    entryRule: "Mark first 30 minute high/low and enter on clean break above range high.",
    confirmationRule: "Break candle should close outside range with rising volume.",
    stopLossRule: "Stop below midpoint of opening range or below breakout candle low.",
    takeProfitRule: "Target measured move equal to opening range, then trail below higher lows.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.1,
    supportWeights: [0.7, 1.3],
    resistanceWeights: [1.1, 2.2],
    stopBuffer: 0.38,
    targetWeights: [1.2, 2.1, 3],
    checklist: [
      "No breakout fade in first retest",
      "Range width not excessively large",
      "Momentum oscillator supports breakout",
    ],
  },
  {
    id: "15m-vwap-reclaim",
    timeframe: "15m",
    name: "VWAP Reclaim Continuation",
    style: "momentum",
    description: "Use VWAP reclaim as a continuation trigger in active intraday trends.",
    entryRule: "Enter after price reclaims VWAP and closes above the reclaim candle high.",
    confirmationRule: "At least two candles hold above VWAP with higher lows.",
    stopLossRule: "Stop below VWAP and below reclaim pullback low.",
    takeProfitRule: "Take partials at prior intraday high and extension into momentum burst.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "breakout",
    volatilityMultiplier: 0.95,
    supportWeights: [0.75, 1.45],
    resistanceWeights: [1, 2],
    stopBuffer: 0.35,
    targetWeights: [1, 1.9, 2.8],
    checklist: [
      "VWAP slope is upward",
      "Price rejects downside VWAP retest",
      "Breadth of market is not collapsing",
    ],
  },
  {
    id: "15m-rsi-divergence",
    timeframe: "15m",
    name: "RSI Divergence Reversal",
    style: "reversal",
    description: "Look for momentum divergence near intraday support for quick mean reversion.",
    entryRule: "Enter when bullish RSI divergence confirms with break above trigger candle high.",
    confirmationRule: "Second low must hold key support while RSI prints a higher low.",
    stopLossRule: "Stop below divergence low and invalidate if support fails.",
    takeProfitRule: "First target at VWAP, second at previous lower high, final at range top.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "reversal",
    volatilityMultiplier: 1.05,
    supportWeights: [0.95, 1.8],
    resistanceWeights: [0.9, 1.7],
    stopBuffer: 0.28,
    targetWeights: [0.9, 1.6, 2.4],
    checklist: [
      "RSI divergence visible on at least two swings",
      "Support zone tested at least once before trigger",
      "Avoid trading directly into macro news release",
    ],
  },
  {
    id: "15m-bollinger-squeeze",
    timeframe: "15m",
    name: "Bollinger Squeeze Expansion",
    style: "breakout",
    description: "Trade post-compression expansion after Bollinger Bands contract.",
    entryRule: "Enter on close above squeeze high once bands begin widening.",
    confirmationRule: "Volume spike and ADX rising above contraction levels.",
    stopLossRule: "Stop below squeeze base or below 20-period mid band.",
    takeProfitRule: "Target 1x and 1.5x squeeze range, then trail for trend day extension.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.2,
    supportWeights: [0.7, 1.25],
    resistanceWeights: [1.2, 2.4],
    stopBuffer: 0.42,
    targetWeights: [1.3, 2.2, 3.2],
    checklist: [
      "Bands were narrow for at least 8 candles",
      "Break candle closes near high",
      "No immediate resistance directly above breakout",
    ],
  },
  {
    id: "4h-ema-continuation",
    timeframe: "4h",
    name: "20/50 EMA Trend Continuation",
    style: "trend",
    description: "Ride mid-term trend after pullback into dynamic EMA support.",
    entryRule: "Enter on bullish rejection from 20 EMA with 50 EMA still sloping upward.",
    confirmationRule: "4h structure keeps higher highs and higher lows.",
    stopLossRule: "Stop below 50 EMA and below most recent swing low.",
    takeProfitRule: "Scale at previous high breakout, then trail under 20 EMA.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "pullback",
    volatilityMultiplier: 0.9,
    supportWeights: [0.9, 1.7],
    resistanceWeights: [1.1, 2.1],
    stopBuffer: 0.35,
    targetWeights: [1.1, 2, 2.9],
    checklist: [
      "20 EMA remains above 50 EMA",
      "Pullback volume is lighter than impulse volume",
      "No bearish divergence on entry trigger",
    ],
  },
  {
    id: "4h-macd-momentum",
    timeframe: "4h",
    name: "MACD Momentum Cross",
    style: "momentum",
    description: "Use MACD line crossover with histogram expansion for directional swing entries.",
    entryRule: "Enter after bullish MACD cross above signal line near zero line reclaim.",
    confirmationRule: "Histogram flips positive and price closes above prior 4h high.",
    stopLossRule: "Stop below recent pivot low and below MACD failure level.",
    takeProfitRule: "Take profits at 1.5R and 2.5R, leave final piece for trend continuation.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "market",
    volatilityMultiplier: 1,
    supportWeights: [0.95, 1.85],
    resistanceWeights: [1.2, 2.3],
    stopBuffer: 0.34,
    targetWeights: [1.2, 2.2, 3.1],
    checklist: [
      "MACD cross is fresh, not late-stage",
      "Price action confirms with breakout close",
      "Market beta is supportive",
    ],
  },
  {
    id: "4h-ichimoku-breakout",
    timeframe: "4h",
    name: "Ichimoku Kumo Breakout",
    style: "breakout",
    description: "Trade clean breaks above the cloud with lagging span confirmation.",
    entryRule: "Enter when candle closes above Kumo and Tenkan crosses above Kijun.",
    confirmationRule: "Chikou span sits above price and cloud twists bullish.",
    stopLossRule: "Stop below Kijun or below cloud top on failed retest.",
    takeProfitRule: "Targets at prior swing highs and projected cloud edge expansion.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.05,
    supportWeights: [0.85, 1.6],
    resistanceWeights: [1.25, 2.5],
    stopBuffer: 0.4,
    targetWeights: [1.3, 2.3, 3.3],
    checklist: [
      "Breakout candle closes outside cloud body",
      "No immediate bearish cloud overhead on higher timeframe",
      "Retest respects cloud support",
    ],
  },
  {
    id: "4h-range-break-retest",
    timeframe: "4h",
    name: "Range Break and Retest",
    style: "breakout",
    description: "Wait for breakout from consolidation and enter on successful retest.",
    entryRule: "Mark range highs/lows and buy retest of broken range top.",
    confirmationRule: "Retest candle must reject downside and close back above range line.",
    stopLossRule: "Stop below retest low and below range midpoint.",
    takeProfitRule: "Target range height projection and next major resistance shelf.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "pullback",
    volatilityMultiplier: 1.1,
    supportWeights: [0.9, 1.75],
    resistanceWeights: [1.25, 2.4],
    stopBuffer: 0.37,
    targetWeights: [1.2, 2.1, 3],
    checklist: [
      "Breakout happened after at least 5 touches in range",
      "Retest has lower sell volume than breakout buy volume",
      "Range top flips into support",
    ],
  },
  {
    id: "4h-adx-trend",
    timeframe: "4h",
    name: "ADX Trend Strength Ride",
    style: "trend",
    description: "Deploy capital when ADX confirms trend strength and DI+ leads DI-.",
    entryRule: "Enter on continuation pullback while ADX rises above 25.",
    confirmationRule: "DI+ remains above DI- and candles hold above 20 EMA.",
    stopLossRule: "Stop below pullback swing low or ADX trend failure pivot.",
    takeProfitRule: "Scale out into extension as ADX peaks; trail remaining position.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "market",
    volatilityMultiplier: 0.95,
    supportWeights: [1, 1.9],
    resistanceWeights: [1.1, 2.1],
    stopBuffer: 0.36,
    targetWeights: [1, 1.9, 2.8],
    checklist: [
      "ADX rising and above threshold",
      "Trend pullback not deeper than prior impulse midpoint",
      "No macro event risk in next 8 hours",
    ],
  },
  {
    id: "1d-golden-cross",
    timeframe: "1d",
    name: "50/200 SMA Golden Cross",
    style: "trend",
    description: "Use long-horizon trend transition when 50 SMA crosses above 200 SMA.",
    entryRule: "Enter on first pullback after bullish cross with daily close above 50 SMA.",
    confirmationRule: "Higher highs continue and cross is not immediately fading.",
    stopLossRule: "Stop below 200 SMA or below major daily swing support.",
    takeProfitRule: "Take partial at prior macro resistance, trail remainder with 50 SMA.",
    holdWindow: "Next daily candle only",
    entryMode: "pullback",
    volatilityMultiplier: 0.9,
    supportWeights: [1.1, 2],
    resistanceWeights: [1.3, 2.5],
    stopBuffer: 0.32,
    targetWeights: [1.1, 2.2, 3.3],
    checklist: [
      "Golden cross happened within last 20 candles",
      "Price not extended more than 2 ATR above 50 SMA",
      "Sector and BTC trend are aligned",
    ],
  },
  {
    id: "1d-rsi-range-shift",
    timeframe: "1d",
    name: "RSI Range Shift Trend",
    style: "momentum",
    description: "Enter when RSI transitions into bullish regime and price confirms breakout.",
    entryRule: "Enter after RSI holds above 50 and price breaks previous daily high.",
    confirmationRule: "RSI pullbacks stay above 40 and trend structure remains intact.",
    stopLossRule: "Stop below breakout base and below regime shift support.",
    takeProfitRule: "Scale at 1.5R and 3R, then trail if RSI remains in bullish range.",
    holdWindow: "Next daily candle only",
    entryMode: "market",
    volatilityMultiplier: 1,
    supportWeights: [1.05, 1.95],
    resistanceWeights: [1.2, 2.35],
    stopBuffer: 0.35,
    targetWeights: [1.2, 2.3, 3.4],
    checklist: [
      "RSI bullish range is persistent, not one candle",
      "Breakout comes with broad-market participation",
      "No bearish divergence near entry",
    ],
  },
  {
    id: "1d-donchian-breakout",
    timeframe: "1d",
    name: "Donchian Channel Breakout",
    style: "breakout",
    description: "Buy fresh 20-day high breaks and let winners run using channel trailing stops.",
    entryRule: "Enter on daily close above upper Donchian channel.",
    confirmationRule: "Breakout should happen after volatility contraction phase.",
    stopLossRule: "Stop below middle channel initially, then trail below lower channel.",
    takeProfitRule: "Scale partially at 2R and hold remainder while channel trend survives.",
    holdWindow: "Next daily candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.15,
    supportWeights: [1, 1.85],
    resistanceWeights: [1.35, 2.7],
    stopBuffer: 0.41,
    targetWeights: [1.3, 2.4, 3.6],
    checklist: [
      "At least 20-candle breakout level is clearly defined",
      "No immediate overhead supply cluster",
      "Daily close confirms breakout, not intraday wick",
    ],
  },
  {
    id: "1d-atr-expansion",
    timeframe: "1d",
    name: "ATR Volatility Expansion",
    style: "breakout",
    description: "Trade volatility regime shift when ATR expands from compression zones.",
    entryRule: "Enter on high range bullish candle after ATR expansion trigger.",
    confirmationRule: "ATR rises above its 14-period average with bullish close location.",
    stopLossRule: "Stop below expansion candle low or 1 ATR below entry.",
    takeProfitRule: "Use 1 ATR and 2 ATR targets, then trail with chandelier stop.",
    holdWindow: "Next daily candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.25,
    supportWeights: [0.95, 1.75],
    resistanceWeights: [1.4, 2.8],
    stopBuffer: 0.43,
    targetWeights: [1.4, 2.5, 3.8],
    checklist: [
      "ATR was compressed before expansion move",
      "Expansion candle closes in top 25% of range",
      "Follow-through appears within next 2 candles",
    ],
  },
  {
    id: "1d-20ema-mean-reversion",
    timeframe: "1d",
    name: "20 EMA Mean Reversion",
    style: "mean-reversion",
    description: "Fade stretched selloffs back toward daily mean in strong coins.",
    entryRule: "Enter after sharp drop into support when bullish reversal candle forms.",
    confirmationRule: "Price reclaims previous day high or 20 EMA in next two sessions.",
    stopLossRule: "Stop below panic low and invalidate on close under support shelf.",
    takeProfitRule: "First target at 20 EMA, second at prior swing high, third at trend continuation.",
    holdWindow: "Next daily candle only",
    entryMode: "reversal",
    volatilityMultiplier: 1.05,
    supportWeights: [1.2, 2.2],
    resistanceWeights: [1.1, 2.1],
    stopBuffer: 0.3,
    targetWeights: [1, 1.8, 2.7],
    checklist: [
      "Selloff is extended and momentum is decelerating",
      "Support level has historical reaction",
      "Reversal candle prints with strong close",
    ],
  },
  {
    id: "1w-wyckoff-breakout",
    timeframe: "1w",
    name: "Wyckoff Accumulation Breakout",
    style: "breakout",
    description: "Position for long trend legs after multi-week accumulation completes.",
    entryRule: "Enter on weekly breakout above accumulation range with expanding spread.",
    confirmationRule: "Breakout follows spring/test behavior and volume confirmation.",
    stopLossRule: "Stop below backup/retest low or below range midpoint.",
    takeProfitRule: "Scale at range projection, then trail below weekly higher lows.",
    holdWindow: "Next weekly candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.15,
    supportWeights: [1.1, 2.1],
    resistanceWeights: [1.5, 3],
    stopBuffer: 0.45,
    targetWeights: [1.4, 2.7, 4],
    checklist: [
      "Trading range lasted at least 8 weeks",
      "Breakout closes above resistance, not wick only",
      "Retest holds above range ceiling",
    ],
  },
  {
    id: "1w-support-resistance-swing",
    timeframe: "1w",
    name: "Weekly Support Resistance Swing",
    style: "mean-reversion",
    description: "Accumulate near weekly support and distribute into weekly resistance bands.",
    entryRule: "Enter when weekly candle rejects long-term support and closes strong.",
    confirmationRule: "Momentum stabilizes and lower timeframe prints higher low sequence.",
    stopLossRule: "Stop below weekly support sweep low and close-based invalidation.",
    takeProfitRule: "Take profits into first and second weekly resistance shelves.",
    holdWindow: "Next weekly candle only",
    entryMode: "pullback",
    volatilityMultiplier: 1,
    supportWeights: [1.25, 2.3],
    resistanceWeights: [1.2, 2.2],
    stopBuffer: 0.33,
    targetWeights: [1.1, 2.1, 3.1],
    checklist: [
      "Support has multiple prior weekly reactions",
      "Rejection candle has long lower wick",
      "Macro trend is not in structural breakdown",
    ],
  },
  {
    id: "1w-channel-trend",
    timeframe: "1w",
    name: "Weekly Channel Trend Ride",
    style: "trend",
    description: "Buy pullbacks to channel support while long-term channel remains intact.",
    entryRule: "Enter on touch/reclaim of channel support with bullish weekly close.",
    confirmationRule: "Channel slope stays positive and lows respect trendline.",
    stopLossRule: "Stop below channel breakdown close and prior swing support.",
    takeProfitRule: "Scale near channel midline and channel top, trail core position.",
    holdWindow: "Next weekly candle only",
    entryMode: "pullback",
    volatilityMultiplier: 0.95,
    supportWeights: [1.3, 2.4],
    resistanceWeights: [1.35, 2.5],
    stopBuffer: 0.36,
    targetWeights: [1.2, 2.2, 3.2],
    checklist: [
      "At least three clean touches define channel",
      "Pullback volume contracts into support",
      "Breakout above midline confirms momentum return",
    ],
  },
  {
    id: "1w-macd-position",
    timeframe: "1w",
    name: "Weekly MACD Position Trade",
    style: "momentum",
    description: "Hold longer swings when weekly MACD turns positive from base structures.",
    entryRule: "Enter after weekly MACD bullish cross with price above 20-week EMA.",
    confirmationRule: "Histogram expands for at least two weeks after cross.",
    stopLossRule: "Stop below 20-week EMA and below trigger week low.",
    takeProfitRule: "Partial exits at 2R and 4R while trailing with weekly EMA.",
    holdWindow: "Next weekly candle only",
    entryMode: "market",
    volatilityMultiplier: 1.05,
    supportWeights: [1.2, 2.25],
    resistanceWeights: [1.4, 2.8],
    stopBuffer: 0.4,
    targetWeights: [1.3, 2.6, 3.9],
    checklist: [
      "Weekly cross is from below zero or near it",
      "Price closes above 20-week EMA",
      "No major resistance immediately overhead",
    ],
  },
  {
    id: "1w-base-breakout",
    timeframe: "1w",
    name: "Multi-Week Base Breakout",
    style: "breakout",
    description: "Deploy on clean breakout from long basing structure with volume support.",
    entryRule: "Enter weekly close above base resistance or on first successful retest.",
    confirmationRule: "Breakout volume exceeds base average and spread widens.",
    stopLossRule: "Stop below base top on retest failure.",
    takeProfitRule: "Use base height projection for targets and trail final tranche.",
    holdWindow: "Next weekly candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.2,
    supportWeights: [1.15, 2.2],
    resistanceWeights: [1.55, 3.1],
    stopBuffer: 0.46,
    targetWeights: [1.5, 2.8, 4.2],
    checklist: [
      "Base formed for at least 10 weeks",
      "Breakout confirmed by weekly close",
      "Retest respects breakout level if it occurs",
    ],
  },
  {
    id: "15m-supertrend-flip",
    timeframe: "15m",
    name: "Supertrend Flip Continuation",
    style: "trend",
    description: "Trade quick continuation when Supertrend flips bullish after compression.",
    reasoning:
      "A fresh Supertrend flip after low volatility often starts an impulse leg. Combining that with immediate follow-through reduces fake entries.",
    entryRule: "Enter when first candle closes above Supertrend and next candle holds that close.",
    confirmationRule: "Momentum candle body should be larger than the previous 3-candle average.",
    stopLossRule: "Stop below Supertrend line and below trigger candle low.",
    takeProfitRule: "Book partial at 1R, hold TP2 at 2R and trail final piece if momentum remains.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "market",
    volatilityMultiplier: 1.02,
    supportWeights: [0.85, 1.55],
    resistanceWeights: [1.05, 2.05],
    stopBuffer: 0.33,
    targetWeights: [1, 2, 3],
    checklist: [
      "Supertrend flip is fresh, not delayed",
      "No large upper wick on trigger candle",
      "Price remains above intraday VWAP",
    ],
  },
  {
    id: "15m-liquidity-sweep-reclaim",
    timeframe: "15m",
    name: "Liquidity Sweep Reclaim",
    style: "reversal",
    description: "Capture reversals after support sweep and fast reclaim.",
    reasoning:
      "When stops are swept below a known low and price reclaims fast, weak hands are out and mean reversion momentum can be strong.",
    entryRule: "Enter after wick sweep below prior low and close back above reclaimed level.",
    confirmationRule: "Second candle should hold reclaimed level and print higher low.",
    stopLossRule: "Stop below sweep wick low.",
    takeProfitRule: "Target prior range midpoint at TP1 and range high at TP2.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "reversal",
    volatilityMultiplier: 1.06,
    supportWeights: [0.95, 1.75],
    resistanceWeights: [0.95, 1.85],
    stopBuffer: 0.29,
    targetWeights: [1, 2, 3],
    checklist: [
      "Sweep level is a visible prior low",
      "Reclaim candle closes in top half",
      "Do not trade against strong higher-timeframe dump",
    ],
  },
  {
    id: "15m-pivot-break-retest",
    timeframe: "15m",
    name: "Pivot Break Retest",
    style: "breakout",
    description: "Trade intraday pivot breakouts after successful retest.",
    reasoning:
      "A pivot break followed by a clean retest confirms acceptance above resistance, which typically provides lower-risk continuation entries.",
    entryRule: "Enter when daily pivot resistance breaks and retest holds.",
    confirmationRule: "Retest candle should close above pivot with rising bid volume.",
    stopLossRule: "Stop below retest low and below pivot level.",
    takeProfitRule: "TP1 at 1R, TP2 at 2R, TP3 at 3R only if momentum persists.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "pullback",
    volatilityMultiplier: 1.08,
    supportWeights: [0.82, 1.5],
    resistanceWeights: [1.15, 2.2],
    stopBuffer: 0.35,
    targetWeights: [1, 2, 3],
    checklist: [
      "Pivot break happens with decisive body close",
      "Retest does not lose pivot on close",
      "No major resistance immediately above",
    ],
  },
  {
    id: "15m-range-fade",
    timeframe: "15m",
    name: "Range Extremes Fade",
    style: "mean-reversion",
    description: "Fade overextensions at intraday range edges.",
    reasoning:
      "Inside stable ranges, edge-to-mean trades outperform chasing mid-range candles. Entries at extremes reduce stop distance.",
    entryRule: "Enter long near range low after rejection wick and bullish close.",
    confirmationRule: "Range midpoint should be reached quickly after trigger.",
    stopLossRule: "Stop under range low sweep.",
    takeProfitRule: "Take profits at midpoint then opposite edge if momentum allows.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "reversal",
    volatilityMultiplier: 0.92,
    supportWeights: [1.02, 1.9],
    resistanceWeights: [0.9, 1.6],
    stopBuffer: 0.27,
    targetWeights: [1, 2, 3],
    checklist: [
      "Market is range-bound, not trending hard",
      "Entry happens near clear edge",
      "Wick rejection is visible",
    ],
  },
  {
    id: "15m-micro-trendline-break",
    timeframe: "15m",
    name: "Micro Trendline Breakout",
    style: "momentum",
    description: "Enter on short trendline break with momentum expansion.",
    reasoning:
      "Micro trendline breaks often signal shift from pullback to impulse. Confirming with expansion avoids low-quality chop breaks.",
    entryRule: "Enter when descending micro trendline breaks with close above previous candle high.",
    confirmationRule: "Break candle volume above recent average.",
    stopLossRule: "Stop below last higher low before breakout.",
    takeProfitRule: "Use fixed 1R/2R/3R targets and trail only after TP2.",
    holdWindow: "Next 15-minute candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.04,
    supportWeights: [0.88, 1.62],
    resistanceWeights: [1.08, 2.12],
    stopBuffer: 0.34,
    targetWeights: [1, 2, 3],
    checklist: [
      "Trendline has at least three touches",
      "Break candle closes above structure, not wick only",
      "Momentum confirms in next candle",
    ],
  },
  {
    id: "4h-supertrend-pullback",
    timeframe: "4h",
    name: "4H Supertrend Pullback",
    style: "trend",
    description: "Buy pullbacks while Supertrend remains bullish on 4-hour chart.",
    reasoning:
      "Supertrend provides an adaptive trend filter. Pullback entries above trend support usually offer better risk than breakout chasing.",
    entryRule: "Enter on bullish rejection candle near Supertrend support.",
    confirmationRule: "Price must close back above prior 4h candle high.",
    stopLossRule: "Stop below Supertrend and pullback swing low.",
    takeProfitRule: "Lock 1R partial, hold TP2 at 2R, trail runner to structure highs.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "pullback",
    volatilityMultiplier: 0.98,
    supportWeights: [0.94, 1.78],
    resistanceWeights: [1.12, 2.2],
    stopBuffer: 0.36,
    targetWeights: [1, 2, 3],
    checklist: [
      "Supertrend remains bullish before entry",
      "Pullback depth stays within trend structure",
      "Reversal candle has strong close",
    ],
  },
  {
    id: "4h-triple-top-break",
    timeframe: "4h",
    name: "Triple Top Breakout",
    style: "breakout",
    description: "Trade clean breakout after repeated resistance tests.",
    reasoning:
      "Multiple tests consume resting sell liquidity. A clean break after third test often leads to expansion with better follow-through.",
    entryRule: "Enter on 4h close above triple-top resistance.",
    confirmationRule: "Break candle should close near highs and not retrace more than 50%.",
    stopLossRule: "Stop below breakout base.",
    takeProfitRule: "Use 1:2 target first, then extend to 1:3 if structure remains bullish.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.1,
    supportWeights: [0.9, 1.72],
    resistanceWeights: [1.22, 2.35],
    stopBuffer: 0.38,
    targetWeights: [1, 2, 3],
    checklist: [
      "Resistance tested at least three times",
      "Breakout candle closes above level",
      "No immediate macro resistance overhead",
    ],
  },
  {
    id: "4h-mean-reversion-band",
    timeframe: "4h",
    name: "Bollinger Mid-Band Reversion",
    style: "mean-reversion",
    description: "Buy oversold 4h deviations back toward the moving average.",
    reasoning:
      "Sharp deviations below lower band often revert to the mean. Taking entries only after reclaim reduces catching falling knives.",
    entryRule: "Enter after close back inside bands following lower-band extension.",
    confirmationRule: "RSI should recover above 35 on the same candle.",
    stopLossRule: "Stop below extension wick low.",
    takeProfitRule: "TP1 at middle band, TP2 at 2R, optional TP3 if trend flips.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "reversal",
    volatilityMultiplier: 0.95,
    supportWeights: [1.05, 1.95],
    resistanceWeights: [1, 1.95],
    stopBuffer: 0.31,
    targetWeights: [1, 2, 3],
    checklist: [
      "Lower band extension is clear",
      "Close re-enters band before entry",
      "Avoid when higher timeframe is in panic selloff",
    ],
  },
  {
    id: "4h-higher-low-breakout",
    timeframe: "4h",
    name: "Higher Low Breakout Ladder",
    style: "momentum",
    description: "Build position after sequence of higher lows under resistance.",
    reasoning:
      "A staircase of higher lows into resistance shows buyers absorbing supply. Break above the cap can trigger rapid upside.",
    entryRule: "Enter on breakout above horizontal resistance after at least two higher lows.",
    confirmationRule: "Break candle should exceed average true range body size.",
    stopLossRule: "Stop below latest higher low.",
    takeProfitRule: "Take TP1 at 1R and TP2 at 2R; protect capital aggressively after TP1.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.06,
    supportWeights: [0.92, 1.76],
    resistanceWeights: [1.18, 2.25],
    stopBuffer: 0.37,
    targetWeights: [1, 2, 3],
    checklist: [
      "Higher low pattern is visible",
      "Resistance level is clean and repeated",
      "Break candle closes above line",
    ],
  },
  {
    id: "4h-atr-trailing-break",
    timeframe: "4h",
    name: "ATR Trailing Stop Flip",
    style: "trend",
    description: "Enter when ATR trailing stop flips bullish with trend continuation.",
    reasoning:
      "ATR stop flips mark directional control change. Using them with structure confirmation improves trend-catch probability.",
    entryRule: "Enter after ATR stop flips to bullish and first pullback holds above it.",
    confirmationRule: "Price should print higher close than flip candle.",
    stopLossRule: "Stop below ATR trailing stop and local pivot.",
    takeProfitRule: "Keep TP2 at 2R and only hold TP3 if ATR stop keeps climbing.",
    holdWindow: "Next 4-hour candle only",
    entryMode: "market",
    volatilityMultiplier: 1,
    supportWeights: [0.95, 1.8],
    resistanceWeights: [1.12, 2.18],
    stopBuffer: 0.35,
    targetWeights: [1, 2, 3],
    checklist: [
      "ATR flip is confirmed on close",
      "No immediate bearish engulfing after flip",
      "Pullback respects ATR line",
    ],
  },
  {
    id: "1d-volume-climax-reversal",
    timeframe: "1d",
    name: "Daily Volume Climax Reversal",
    style: "reversal",
    description: "Catch daily reversals after panic sell climax and reclaim.",
    reasoning:
      "Capitulation days often create exhaustion lows. Reclaiming key levels after climax volume can start strong multi-day mean reversion.",
    entryRule: "Enter after daily hammer forms on extreme volume and closes above midpoint.",
    confirmationRule: "Next daily candle must hold above reversal candle low.",
    stopLossRule: "Stop below climax wick low.",
    takeProfitRule: "TP2 fixed at 2R; reduce size if reversal fails to follow through.",
    holdWindow: "Next daily candle only",
    entryMode: "reversal",
    volatilityMultiplier: 1.08,
    supportWeights: [1.2, 2.15],
    resistanceWeights: [1.1, 2.1],
    stopBuffer: 0.32,
    targetWeights: [1, 2, 3],
    checklist: [
      "Volume spike is clearly above recent average",
      "Reversal candle closes strong",
      "Follow-through candle appears quickly",
    ],
  },
  {
    id: "1d-bull-flag-breakout",
    timeframe: "1d",
    name: "Daily Bull Flag Breakout",
    style: "breakout",
    description: "Trade continuation when daily bull flag resolves upward.",
    reasoning:
      "Bull flags represent controlled profit-taking in an uptrend. Breakout from the flag often resumes impulse direction.",
    entryRule: "Enter on close above flag resistance trendline.",
    confirmationRule: "Breakout should happen with larger-than-average range.",
    stopLossRule: "Stop below flag low or below breakout retest level.",
    takeProfitRule: "Use 1R, 2R, 3R ladder with TP2 as primary objective.",
    holdWindow: "Next daily candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.12,
    supportWeights: [1.02, 1.9],
    resistanceWeights: [1.3, 2.55],
    stopBuffer: 0.39,
    targetWeights: [1, 2, 3],
    checklist: [
      "Flag follows a clear prior impulse",
      "Consolidation slope is downward/sideways",
      "Breakout close is decisive",
    ],
  },
  {
    id: "1d-ema-ribbon-hold",
    timeframe: "1d",
    name: "EMA Ribbon Support Hold",
    style: "trend",
    description: "Enter trend continuation when price defends daily EMA ribbon.",
    reasoning:
      "EMA ribbons define dynamic support in healthy trends. Rejection from ribbon often provides lower-risk continuation entries.",
    entryRule: "Enter when daily candle rejects EMA ribbon and closes above prior day high.",
    confirmationRule: "Ribbon remains positively stacked and rising.",
    stopLossRule: "Stop below ribbon base and recent swing low.",
    takeProfitRule: "Secure TP1 at 1R and TP2 at 2R; trail after TP2.",
    holdWindow: "Next daily candle only",
    entryMode: "pullback",
    volatilityMultiplier: 0.96,
    supportWeights: [1.1, 2],
    resistanceWeights: [1.18, 2.3],
    stopBuffer: 0.34,
    targetWeights: [1, 2, 3],
    checklist: [
      "Ribbon slope is upward",
      "Pullback does not close below ribbon base",
      "Close reclaims momentum quickly",
    ],
  },
  {
    id: "1d-base-reclaim",
    timeframe: "1d",
    name: "Daily Base Reclaim Setup",
    style: "momentum",
    description: "Trade when price reclaims long consolidation base and confirms support.",
    reasoning:
      "Reclaiming a long base means market accepts higher value. Retest confirmation improves probability and keeps risk contained.",
    entryRule: "Enter on successful retest after close above base neckline.",
    confirmationRule: "Retest candle should close above neckline with reduced selling pressure.",
    stopLossRule: "Stop below neckline and retest low.",
    takeProfitRule: "TP2 at 2R is mandatory, TP3 only if trend accelerates.",
    holdWindow: "Next daily candle only",
    entryMode: "pullback",
    volatilityMultiplier: 1.03,
    supportWeights: [1.08, 2.02],
    resistanceWeights: [1.22, 2.4],
    stopBuffer: 0.36,
    targetWeights: [1, 2, 3],
    checklist: [
      "Base formed over multiple weeks",
      "Reclaim candle closes above neckline",
      "Retest confirms level as support",
    ],
  },
  {
    id: "1d-trendline-break-retest",
    timeframe: "1d",
    name: "Daily Trendline Break Retest",
    style: "breakout",
    description: "Enter after bearish trendline break and bullish retest.",
    reasoning:
      "Breaking a major downtrend line changes structure. Retest entries reduce false-break risk and improve R multiple quality.",
    entryRule: "Enter on retest hold of broken trendline with bullish close.",
    confirmationRule: "Momentum indicator should shift from bearish to neutral/bullish.",
    stopLossRule: "Stop below retest low.",
    takeProfitRule: "Maintain TP2 at 2R and trail final position into next resistance.",
    holdWindow: "Next daily candle only",
    entryMode: "pullback",
    volatilityMultiplier: 1.07,
    supportWeights: [1.05, 1.95],
    resistanceWeights: [1.25, 2.45],
    stopBuffer: 0.37,
    targetWeights: [1, 2, 3],
    checklist: [
      "Trendline has at least three touches",
      "Break candle closes beyond line",
      "Retest holds without deep failure",
    ],
  },
  {
    id: "1w-ema-reclaim",
    timeframe: "1w",
    name: "Weekly EMA Reclaim",
    style: "trend",
    description: "Use weekly EMA reclaim to enter macro trend continuation.",
    reasoning:
      "Weekly EMA reclaim often signals strong regime continuation. Waiting for reclaim close avoids entering during weak bounces.",
    entryRule: "Enter after weekly close back above 20/30 EMA cluster.",
    confirmationRule: "Next weekly candle should not close back below EMA cluster.",
    stopLossRule: "Stop below reclaim candle low.",
    takeProfitRule: "TP2 fixed at 2R with optional extended TP3 into macro resistance.",
    holdWindow: "Next weekly candle only",
    entryMode: "market",
    volatilityMultiplier: 0.98,
    supportWeights: [1.2, 2.2],
    resistanceWeights: [1.38, 2.72],
    stopBuffer: 0.39,
    targetWeights: [1, 2, 3],
    checklist: [
      "Weekly close above EMA cluster confirmed",
      "No immediate bearish rejection candle",
      "Macro structure remains bullish",
    ],
  },
  {
    id: "1w-flag-continuation",
    timeframe: "1w",
    name: "Weekly Flag Continuation",
    style: "breakout",
    description: "Trade breakout from weekly continuation flag.",
    reasoning:
      "Weekly flags represent healthy consolidation in broader uptrends. Breakout from the flag often starts a multi-week push.",
    entryRule: "Enter on weekly close above flag resistance.",
    confirmationRule: "Breakout spread should exceed prior two-week average spread.",
    stopLossRule: "Stop below flag support trendline.",
    takeProfitRule: "Use strict 1R/2R/3R ladder with TP2 as core take-profit.",
    holdWindow: "Next weekly candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.1,
    supportWeights: [1.16, 2.18],
    resistanceWeights: [1.52, 2.98],
    stopBuffer: 0.43,
    targetWeights: [1, 2, 3],
    checklist: [
      "Flag forms after strong up impulse",
      "Resistance line is clean",
      "Breakout closes above structure",
    ],
  },
  {
    id: "1w-break-structure-retest",
    timeframe: "1w",
    name: "Weekly BOS Retest",
    style: "momentum",
    description: "Buy retest after bullish break of weekly market structure.",
    reasoning:
      "A break of market structure with successful retest indicates trend transition and institutional acceptance at higher prices.",
    entryRule: "Enter on bullish retest of broken structure level.",
    confirmationRule: "Retest week should close above the structure break point.",
    stopLossRule: "Stop below retest swing low.",
    takeProfitRule: "Take TP1 at 1R and TP2 at 2R. Hold TP3 only on continued weekly strength.",
    holdWindow: "Next weekly candle only",
    entryMode: "pullback",
    volatilityMultiplier: 1.04,
    supportWeights: [1.22, 2.26],
    resistanceWeights: [1.42, 2.85],
    stopBuffer: 0.4,
    targetWeights: [1, 2, 3],
    checklist: [
      "Structure break is visible on weekly chart",
      "Retest does not break down on close",
      "Momentum shifts positive after retest",
    ],
  },
  {
    id: "1w-deep-discount-reversal",
    timeframe: "1w",
    name: "Weekly Deep Discount Reversal",
    style: "mean-reversion",
    description: "Accumulate high-conviction reversals after deep weekly discount.",
    reasoning:
      "Deep drawdowns into historical demand zones can offer asymmetric upside if reversal is confirmed with weekly close and follow-through.",
    entryRule: "Enter after bullish engulfing week from major support zone.",
    confirmationRule: "Following week should hold above engulfing midpoint.",
    stopLossRule: "Stop below support sweep low.",
    takeProfitRule: "Use conservative TP2 at 2R and avoid over-sizing in high-volatility reversals.",
    holdWindow: "Next weekly candle only",
    entryMode: "reversal",
    volatilityMultiplier: 1,
    supportWeights: [1.3, 2.4],
    resistanceWeights: [1.25, 2.35],
    stopBuffer: 0.35,
    targetWeights: [1, 2, 3],
    checklist: [
      "Support zone has historical significance",
      "Engulfing week closes strong",
      "No immediate rejection on next candle",
    ],
  },
  {
    id: "1w-momentum-base-expansion",
    timeframe: "1w",
    name: "Weekly Momentum Base Expansion",
    style: "breakout",
    description: "Trade expansion from tight weekly base with momentum shift.",
    reasoning:
      "When volatility compresses for weeks, a breakout with momentum expansion often leads to trend legs with favorable reward-to-risk.",
    entryRule: "Enter on breakout close above tight weekly base.",
    confirmationRule: "Momentum should increase versus previous two weeks.",
    stopLossRule: "Stop below base support and breakout invalidation line.",
    takeProfitRule: "Primary objective TP2 at 2R, optional TP3 as trend extension.",
    holdWindow: "Next weekly candle only",
    entryMode: "breakout",
    volatilityMultiplier: 1.16,
    supportWeights: [1.18, 2.22],
    resistanceWeights: [1.58, 3.05],
    stopBuffer: 0.44,
    targetWeights: [1, 2, 3],
    checklist: [
      "Base is tight and multi-week",
      "Breakout candle closes near top of range",
      "Follow-through appears quickly",
    ],
  },
];

export function getTimeframeLabel(timeframe: StrategyTimeframe): string {
  return TIMEFRAME_CONFIG[timeframe].label;
}

export function getSingleCandleWindow(timeframe: StrategyTimeframe): string {
  switch (timeframe) {
    case "15m":
      return "Next 15-minute candle only";
    case "4h":
      return "Next 4-hour candle only";
    case "1d":
      return "Next daily candle only";
    case "1w":
      return "Next weekly candle only";
    default:
      return "Next candle only";
  }
}

export function getStrategiesByTimeframe(timeframe: StrategyTimeframe): StrategyTemplate[] {
  return STRATEGY_LIBRARY.filter((strategy) => strategy.timeframe === timeframe);
}

export function getStrategyById(id: string): StrategyTemplate | undefined {
  return STRATEGY_LIBRARY.find((strategy) => strategy.id === id);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildEntryPrice(
  currentPrice: number,
  supportPrimary: number,
  resistancePrimary: number,
  rangePercent: number,
  mode: EntryMode,
  maxEntryDiscount: number,
  maxEntryPremium: number
): number {
  const minEntry = currentPrice * (1 - maxEntryDiscount);
  const maxEntry = currentPrice * (1 + maxEntryPremium);

  let rawEntry = currentPrice;
  switch (mode) {
    case "pullback":
      rawEntry = currentPrice - (currentPrice - supportPrimary) * 0.4;
      break;
    case "breakout":
      rawEntry = resistancePrimary * (1 + rangePercent * 0.12);
      rawEntry = Math.max(rawEntry, currentPrice * (1 + Math.max(rangePercent * 0.06, 0.001)));
      break;
    case "reversal":
      rawEntry = supportPrimary * (1 + rangePercent * 0.25);
      break;
    case "market":
    default:
      rawEntry = currentPrice;
      break;
  }

  return clamp(rawEntry, minEntry, maxEntry);
}

function buildRiskReward(entryPrice: number, stopLoss: number, targetPrice: number): number {
  const risk = Math.max(entryPrice - stopLoss, entryPrice * 0.0015);
  const reward = Math.max(targetPrice - entryPrice, 0);
  return reward / risk;
}

export function buildStrategyPlan(coin: CoinMarket, strategy: StrategyTemplate): StrategyPlan {
  const config = TIMEFRAME_CONFIG[strategy.timeframe];
  const currentPrice = Math.max(coin.current_price, 0.0000001);

  const dailyVolatilityPercent = Math.abs(coin.price_change_percentage_24h ?? 2);
  const dailyVolatility = clamp(dailyVolatilityPercent / 100, 0.01, 0.25);

  const rangePercent = clamp(
    dailyVolatility * config.frameMultiplier * strategy.volatilityMultiplier,
    config.minRange,
    config.maxRange
  );

  const supportPrimary = currentPrice * (1 - rangePercent * strategy.supportWeights[0]);
  const supportSecondary = currentPrice * (1 - rangePercent * strategy.supportWeights[1]);
  const resistancePrimary = currentPrice * (1 + rangePercent * strategy.resistanceWeights[0]);
  const resistanceSecondary = currentPrice * (1 + rangePercent * strategy.resistanceWeights[1]);

  const entryPrice = buildEntryPrice(
    currentPrice,
    supportPrimary,
    resistancePrimary,
    rangePercent,
    strategy.entryMode,
    config.maxEntryDiscount,
    config.maxEntryPremium
  );

  const structuralStop = supportSecondary * (1 - rangePercent * strategy.stopBuffer * 0.8);
  const structuralRiskDistance = Math.max(entryPrice - structuralStop, entryPrice * 0.0015);
  const riskDistance = clamp(
    structuralRiskDistance,
    entryPrice * config.minRiskDistance,
    entryPrice * config.maxRiskDistance
  );
  const stopLoss = entryPrice - riskDistance;

  const takeProfit1 = entryPrice + riskDistance * 1;
  const takeProfit2 = entryPrice + riskDistance * 2;
  const takeProfit3 = entryPrice + riskDistance * 3;

  const stopLossPercent = ((entryPrice - stopLoss) / entryPrice) * 100;
  const takeProfit1Percent = ((takeProfit1 - entryPrice) / entryPrice) * 100;
  const takeProfit2Percent = ((takeProfit2 - entryPrice) / entryPrice) * 100;
  const takeProfit3Percent = ((takeProfit3 - entryPrice) / entryPrice) * 100;
  const riskRewardRatio = buildRiskReward(entryPrice, stopLoss, takeProfit2);
  const entryDistancePercent = ((entryPrice - currentPrice) / currentPrice) * 100;

  let executionGuidance =
    "Entry zone is active now. Only execute if confirmation candle closes in your direction.";
  if (entryDistancePercent > 0.8) {
    executionGuidance = `Wait for breakout entry near ${entryPrice.toFixed(6)} (+${entryDistancePercent.toFixed(
      2
    )}% from current). Do not chase early.`;
  } else if (entryDistancePercent < -0.8) {
    executionGuidance = `Wait for pullback entry near ${entryPrice.toFixed(6)} (${entryDistancePercent.toFixed(
      2
    )}% from current). Avoid buying before discount zone.`;
  }

  const positionSizeHint =
    `Risk only ${config.maxRiskPercent.toFixed(2)}% of account on this setup. ` +
    "Position size = (account risk in USD) / (entry - stop distance).";

  const invalidationText =
    `Setup invalid if ${coin.symbol.toUpperCase()} closes below ${supportSecondary.toFixed(6)} ` +
    `or if breakout holds fail under ${resistancePrimary.toFixed(6)}.`;

  return {
    strategy,
    timeframeLabel: config.label,
    executionWindow: getSingleCandleWindow(strategy.timeframe),
    executionGuidance,
    entryDistancePercent,
    currentPrice,
    rangePercent: rangePercent * 100,
    dailyVolatilityPercent,
    entryPrice,
    supportPrimary,
    supportSecondary,
    resistancePrimary,
    resistanceSecondary,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    stopLossPercent,
    takeProfit1Percent,
    takeProfit2Percent,
    takeProfit3Percent,
    riskRewardRatio,
    maxRiskPercent: config.maxRiskPercent,
    positionSizeHint,
    invalidationText,
  };
}
