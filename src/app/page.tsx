"use client";

import { useMemo } from "react";
import { useCryptoData } from "./hooks/useCryptoData";
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  formatUpdated,
} from "./lib/format";
import {
  getAllTopFive,
  calculateViability,
  getLiquidityLabel,
  getRiskLabel,
  getSignalLabel,
} from "./lib/trading";

import Link from "next/link";
import { TopFiveList } from "./components/TopFiveList";

export default function Home() {
  const { coins, fetchedAt, isLoading, error, isRefreshing, refresh } = useCryptoData(100);
  // Get top 5 recommendations for each strategy
  const topFive = useMemo(() => {
    if (coins.length === 0) return null;
    return getAllTopFive(coins);
  }, [coins]);

  const totalMarketCap = coins.reduce(
    (sum, coin) => sum + (coin.market_cap ?? 0),
    0,
  );
  const totalVolume = coins.reduce(
    (sum, coin) => sum + (coin.total_volume ?? 0),
    0,
  );

  const movers = coins.filter(
    (coin) => typeof coin.price_change_percentage_24h === "number",
  );
  const topMover = movers.length
    ? [...movers].sort(
        (a, b) =>
          (b.price_change_percentage_24h ?? 0) -
          (a.price_change_percentage_24h ?? 0),
      )[0]
    : null;
  const laggard = movers.length
    ? [...movers].sort(
        (a, b) =>
          (a.price_change_percentage_24h ?? 0) -
          (b.price_change_percentage_24h ?? 0),
      )[0]
    : null;


  return (
    <div className="page">
      <header className="hero">
        <div className="hero-content">
          <div className="pill">Top 100 by market cap</div>
          <h1 className="hero-title">Pulse100</h1>
          <p className="hero-subtitle">
            A live snapshot of the largest crypto assets. Scan the daily
            momentum, compare market caps, and track volume without leaving the
            fold.
          </p>
          <div className="hero-meta">
            <span>Updated {fetchedAt ? formatUpdated(fetchedAt) : "-"}</span>
            <span>Refreshes every 60 seconds</span>
            <span>No API Key Required</span>
          </div>
        </div>

        <div className="hero-panel">
          <h2 className="panel-title">Market Pulse</h2>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total Market Cap</div>
              <div className="stat-value">
                {totalMarketCap ? formatCompact(totalMarketCap) : "-"}
              </div>
              <div className="stat-foot">Top 100 combined</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">24h Volume</div>
              <div className="stat-value">
                {totalVolume ? formatCompact(totalVolume) : "-"}
              </div>
              <div className="stat-foot">Across tracked assets</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Top Mover</div>
              <div className="stat-value">
                {topMover
                  ? formatPercent(topMover.price_change_percentage_24h)
                  : "-"}
              </div>
              <div className="stat-foot">
                {topMover ? topMover.name : "No data"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Biggest Dip</div>
              <div className="stat-value">
                {laggard
                  ? formatPercent(laggard.price_change_percentage_24h)
                  : "-"}
              </div>
              <div className="stat-foot">
                {laggard ? laggard.name : "No data"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Top 5 Trading Recommendations Section */}
      {!isLoading && !error && topFive && (
        <section className="recommendation-section">
          <div className="recommendation-header">
            <h2 className="recommendation-title">Top 5 Trading Picks</h2>
            <p className="recommendation-subtitle">
              AI-powered top 5 picks for each strategy based on volume, volatility, trend, and market cap analysis
            </p>
          </div>

          <TopFiveList recommendations={topFive.day} strategy="day" />
          <TopFiveList recommendations={topFive.swing} strategy="swing" />
          <TopFiveList recommendations={topFive.safe} strategy="safe" />
        </section>
      )}

      {isLoading ? (
        <div className="loading-box">
          <div className="loading-spinner"></div>
          <p>Loading cryptocurrency data...</p>
        </div>
      ) : error ? (
        <div className="error-box">
          {error}
          <button onClick={refresh} className="retry-button" style={{ marginLeft: "10px" }}>
            Retry
          </button>
        </div>
      ) : (
        <section className="table-wrap" aria-live="polite">
          <div className="table-header">
            <span className="col-rank">#</span>
            <span className="col-asset">Asset</span>
            <span className="col-price">Price</span>
            <span className="col-change">24h</span>
            <span className="col-viability">Viability</span>
            <span className="col-liquidity">Liquidity</span>
            <span className="col-risk">Risk</span>
            <span className="col-signal">Signal</span>
          </div>
          <div>
            {coins.map((coin) => {
              const changeValue = coin.price_change_percentage_24h;
              const changeClass =
                changeValue === null
                  ? ""
                  : changeValue >= 0
                    ? "positive"
                    : "negative";
              
              const viability = calculateViability(coin);
              const viabilityClass = viability.score >= 70 ? "high" : viability.score >= 50 ? "medium" : "low";

              return (
                <Link
                  href={`/coin/${coin.id}`}
                  className="table-row clickable"
                  key={coin.id}
                >
                  <div className="cell rank" data-label="Rank">
                    #{coin.market_cap_rank ?? "-"}
                  </div>
                  <div className="cell name" data-label="Asset">
                    <div className="coin-avatar">
                      {coin.symbol.charAt(0)}
                    </div>
                    <div className="coin-info">
                      <div className="coin-name">{coin.name}</div>
                      <div className="coin-symbol">{coin.symbol}</div>
                    </div>
                  </div>
                  <div className="cell price" data-label="Price">
                    {formatCurrency(coin.current_price)}
                  </div>
                  <div
                    className={`cell change ${changeClass}`}
                    data-label="24h"
                  >
                    <span className="chip">
                      {formatPercent(coin.price_change_percentage_24h)}
                    </span>
                  </div>
                  <div className={`cell viability ${viabilityClass}`} data-label="Viability">
                    <span className="viability-score">{viability.score}/100</span>
                  </div>
                  <div className="cell liquidity" data-label="Liquidity">
                    {getLiquidityLabel(viability.liquidity)}
                  </div>
                  <div className="cell risk" data-label="Risk">
                    {getRiskLabel(viability.risk)}
                  </div>
                  <div className={`cell signal ${viability.signal}`} data-label="Signal">
                    {getSignalLabel(viability.signal)}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="footer-note">
        <span>Prices in USD.</span>
        <span>Data refresh uses client-side caching for stability.</span>
        {isRefreshing && (
          <span className="refreshing-indicator">Refreshing...</span>
        )}
      </div>
    </div>
  );
}
