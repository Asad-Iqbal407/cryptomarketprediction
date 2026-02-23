"use client";

import { useMemo, useState } from "react";
import { CoinMarket } from "../lib/coingecko";
import { formatCurrency } from "../lib/format";
import { useStrategyBacktest } from "../hooks/useStrategyBacktest";
import {
  STRATEGY_LIBRARY,
  STRATEGY_TIMEFRAMES,
  StrategyTimeframe,
  getStrategiesByTimeframe,
  getSingleCandleWindow,
  getTimeframeLabel,
  buildStrategyPlan,
} from "../lib/strategyPlaybook";
import { StrategyBacktestResult } from "../lib/strategyBacktest";

const styleLabelMap = {
  trend: "Trend",
  breakout: "Breakout",
  momentum: "Momentum",
  reversal: "Reversal",
  "mean-reversion": "Mean Reversion",
} as const;

type StrategyStyleKey = keyof typeof styleLabelMap;

function formatSignedPercent(value: number): string {
  const rounded = value.toFixed(2);
  return `${value >= 0 ? "+" : ""}${rounded}%`;
}

function formatBacktestTime(iso: string): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function getScoreClass(score: number): "excellent" | "good" | "average" | "poor" {
  if (score >= 75) return "excellent";
  if (score >= 60) return "good";
  if (score >= 45) return "average";
  return "poor";
}

function renderBacktestSummary(result: StrategyBacktestResult) {
  return (
    <div className="strategy-list-backtest">
      <span className={`score ${getScoreClass(result.score)}`}>Score {result.score}</span>
      <span>Win {result.winRate.toFixed(1)}%</span>
      <span>{result.trades} trades</span>
    </div>
  );
}

export function StrategyPlaybook({ coin }: { coin: CoinMarket }) {
  const [activeTimeframe, setActiveTimeframe] = useState<StrategyTimeframe>("15m");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    getStrategiesByTimeframe("15m")[0]?.id ?? ""
  );
  const {
    results: backtestResults,
    isLoading: backtestLoading,
    error: backtestError,
    fetchedAt: backtestFetchedAt,
  } = useStrategyBacktest(coin.id);
  const strategies = useMemo(
    () => getStrategiesByTimeframe(activeTimeframe),
    [activeTimeframe]
  );

  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.id === selectedStrategyId) ?? strategies[0],
    [strategies, selectedStrategyId]
  );

  const plan = useMemo(
    () => (selectedStrategy ? buildStrategyPlan(coin, selectedStrategy) : null),
    [coin, selectedStrategy]
  );
  const selectedBacktest = selectedStrategy
    ? backtestResults[selectedStrategy.id]
    : undefined;

  if (!plan || !selectedStrategy) {
    return null;
  }

  return (
    <section className="strategy-playbook-section">
      <div className="strategy-playbook-header">
        <h2>Strategy Playbook ({STRATEGY_LIBRARY.length} Setups)</h2>
        <p>
          Choose a timeframe and click a strategy to see entry, support and resistance, stop-loss,
          and profit targets generated from live market data.
        </p>
      </div>

      <div className="strategy-timeframe-tabs">
        {STRATEGY_TIMEFRAMES.map((timeframe) => {
          const count = getStrategiesByTimeframe(timeframe).length;
          const isActive = timeframe === activeTimeframe;
          return (
            <button
              key={timeframe}
              className={`strategy-timeframe-tab ${isActive ? "active" : ""}`}
              onClick={() => {
                setActiveTimeframe(timeframe);
                setSelectedStrategyId(getStrategiesByTimeframe(timeframe)[0]?.id ?? "");
              }}
            >
              {getTimeframeLabel(timeframe)} ({count})
            </button>
          );
        })}
      </div>

      <div className="strategy-playbook-layout">
        <div className="strategy-list">
          {strategies.map((strategy) => {
            const isActive = strategy.id === selectedStrategy.id;
            const itemBacktest = backtestResults[strategy.id];
            return (
              <button
                key={strategy.id}
                className={`strategy-list-item ${isActive ? "active" : ""}`}
                onClick={() => setSelectedStrategyId(strategy.id)}
              >
                <div className="strategy-list-meta">
                  <span>{styleLabelMap[strategy.style as StrategyStyleKey]}</span>
                  <span>{getSingleCandleWindow(strategy.timeframe)}</span>
                </div>
                <h3>{strategy.name}</h3>
                <p>{strategy.description}</p>
                {itemBacktest && renderBacktestSummary(itemBacktest)}
                {!itemBacktest && backtestLoading && (
                  <div className="strategy-list-backtest loading">Backtest loading...</div>
                )}
              </button>
            );
          })}
        </div>

        <article className="strategy-detail-panel">
          <header className="strategy-detail-header">
            <div>
              <span className="strategy-detail-timeframe">{plan.timeframeLabel} Plan</span>
              <h3>{selectedStrategy.name}</h3>
            </div>
            <div className="strategy-detail-stats">
              <span>Price: {formatCurrency(plan.currentPrice)}</span>
              <span>Base Range: {plan.rangePercent.toFixed(2)}%</span>
              <span>24h Volatility: {plan.dailyVolatilityPercent.toFixed(2)}%</span>
              <span>Validity: {plan.executionWindow}</span>
            </div>
          </header>

          <div className="strategy-backtest-box">
            <div className="strategy-backtest-head">
              <h4>Backtest Style Score</h4>
              <span>Updated {formatBacktestTime(backtestFetchedAt)} UTC</span>
            </div>
            {selectedBacktest ? (
              <div className="strategy-backtest-grid">
                <div className="strategy-backtest-stat">
                  <span>Score</span>
                  <strong className={getScoreClass(selectedBacktest.score)}>
                    {selectedBacktest.score}/100
                  </strong>
                </div>
                <div className="strategy-backtest-stat">
                  <span>Win Rate</span>
                  <strong>{selectedBacktest.winRate.toFixed(1)}%</strong>
                </div>
                <div className="strategy-backtest-stat">
                  <span>Trades</span>
                  <strong>{selectedBacktest.trades}</strong>
                </div>
                <div className="strategy-backtest-stat">
                  <span>Confidence</span>
                  <strong>{selectedBacktest.confidence.toUpperCase()}</strong>
                </div>
                <div className="strategy-backtest-stat">
                  <span>Avg Return</span>
                  <strong>{formatSignedPercent(selectedBacktest.avgReturnPercent)}</strong>
                </div>
                <div className="strategy-backtest-stat">
                  <span>Profit Factor</span>
                  <strong>{selectedBacktest.profitFactor.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <p className="strategy-backtest-fallback">
                {backtestLoading
                  ? "Running backtest calculations..."
                  : "Backtest data not available yet for this strategy."}
              </p>
            )}
            {selectedBacktest && (
              <p className="strategy-backtest-note">{selectedBacktest.sampleNote}</p>
            )}
            {backtestError && (
              <p className="strategy-backtest-error">
                Failed to load backtest: {backtestError}
              </p>
            )}
          </div>

          <div className="strategy-core-grid">
            <div className="strategy-core-card">
              <span className="label">Entry</span>
              <strong>{formatCurrency(plan.entryPrice)}</strong>
              <small>
                {plan.entryDistancePercent >= 0
                  ? `${formatSignedPercent(plan.entryDistancePercent)} above current`
                  : `${formatSignedPercent(plan.entryDistancePercent)} below current`}
              </small>
            </div>
            <div className="strategy-core-card stop">
              <span className="label">Stop Loss</span>
              <strong>{formatCurrency(plan.stopLoss)}</strong>
              <small>Risk {plan.stopLossPercent.toFixed(2)}% from entry.</small>
            </div>
            <div className="strategy-core-card profit">
              <span className="label">Target 2</span>
              <strong>{formatCurrency(plan.takeProfit2)}</strong>
              <small>Reward {plan.takeProfit2Percent.toFixed(2)}% from entry.</small>
            </div>
            <div className="strategy-core-card">
              <span className="label">Risk/Reward</span>
              <strong>1 : {plan.riskRewardRatio.toFixed(2)}</strong>
              <small>Target 2 locked to 1:2 by design.</small>
            </div>
          </div>

          <div className="strategy-level-grid">
            <div className="level-card support">
              <span>Support 1</span>
              <strong>{formatCurrency(plan.supportPrimary)}</strong>
            </div>
            <div className="level-card support">
              <span>Support 2</span>
              <strong>{formatCurrency(plan.supportSecondary)}</strong>
            </div>
            <div className="level-card resistance">
              <span>Resistance 1</span>
              <strong>{formatCurrency(plan.resistancePrimary)}</strong>
            </div>
            <div className="level-card resistance">
              <span>Resistance 2</span>
              <strong>{formatCurrency(plan.resistanceSecondary)}</strong>
            </div>
          </div>

          <div className="strategy-target-row">
            <div>
              <span>TP1</span>
              <strong>{formatCurrency(plan.takeProfit1)}</strong>
              <small>{formatSignedPercent(plan.takeProfit1Percent)}</small>
            </div>
            <div>
              <span>TP2</span>
              <strong>{formatCurrency(plan.takeProfit2)}</strong>
              <small>{formatSignedPercent(plan.takeProfit2Percent)}</small>
            </div>
            <div>
              <span>TP3</span>
              <strong>{formatCurrency(plan.takeProfit3)}</strong>
              <small>{formatSignedPercent(plan.takeProfit3Percent)}</small>
            </div>
          </div>

          <div className="strategy-rules-grid">
            <div className="strategy-rule-card">
              <h4>Why This Works</h4>
              <p>{selectedStrategy.reasoning ?? selectedStrategy.description}</p>
            </div>
            <div className="strategy-rule-card">
              <h4>Entry Rule</h4>
              <p>{selectedStrategy.entryRule}</p>
            </div>
            <div className="strategy-rule-card">
              <h4>Confirmation</h4>
              <p>{selectedStrategy.confirmationRule}</p>
            </div>
            <div className="strategy-rule-card">
              <h4>Stop-Loss Rule</h4>
              <p>{selectedStrategy.stopLossRule}</p>
            </div>
            <div className="strategy-rule-card">
              <h4>Profit Rule</h4>
              <p>{selectedStrategy.takeProfitRule}</p>
            </div>
          </div>

          <div className="strategy-checklist">
            <h4>Execution Checklist</h4>
            <ul>
              {selectedStrategy.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="strategy-notes">
            <p className="strategy-guidance">{plan.executionGuidance}</p>
            <p>This setup is valid for {plan.executionWindow.toLowerCase()}. If no trigger, skip and wait for the next setup.</p>
            <p>{plan.positionSizeHint}</p>
            <p>{plan.invalidationText}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
