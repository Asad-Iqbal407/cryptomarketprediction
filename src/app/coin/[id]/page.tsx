"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCryptoData } from "../../hooks/useCryptoData";
import {
  calculateViability,
  getTechnicalIndicators,
  getLiquidityLabel,
  getRiskLabel,
  getSignalLabel,
} from "../../lib/trading";
import { PriceChart } from "../../components/PriceChart";
import { StrategyPlaybook } from "../../components/StrategyPlaybook";
import { formatCurrency, formatCompact, formatPercent } from "../../lib/format";

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;
  const { coins, isLoading, error } = useCryptoData(100);

  const coin = coins.find((c) => c.id === coinId);

  if (isLoading) {
    return (
      <div className="coin-detail-page">
        <div className="coin-detail-shell">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading coin data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="coin-detail-page">
        <div className="coin-detail-shell">
          <div className="error-container">
            <h1>Coin Not Found</h1>
            <p>Unable to load coin data. The coin may not exist or there was an error.</p>
            <Link href="/" className="back-link">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const viability = calculateViability(coin);

  // Placeholder history for indicators
  const mockPrices = [
    coin.current_price * 0.9,
    coin.current_price * 0.95,
    coin.current_price,
  ];
  const indicators = getTechnicalIndicators(mockPrices);

  return (
    <div className="coin-detail-page">
      <div className="coin-detail-shell">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{coin.name}</span>
        </nav>

        <section className="chart-section chart-top">
          <PriceChart coinId={coin.id} coinName={coin.name} />
        </section>

        <header className="coin-header">
          <div className="coin-identity">
            <img
              src={coin.image}
              alt={coin.name}
              width={64}
              height={64}
              className="coin-logo"
            />
            <div className="coin-titles">
              <h1>{coin.name}</h1>
              <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
              <span className="coin-rank">Rank #{coin.market_cap_rank}</span>
            </div>
          </div>

          <div className="coin-price-header">
            <div className="current-price">{formatCurrency(coin.current_price)}</div>
            <div
              className={`price-change ${
                viability.signal === "buy"
                  ? "positive"
                  : viability.signal === "avoid"
                    ? "negative"
                    : "neutral"
              }`}
            >
              {formatPercent(coin.price_change_percentage_24h)}
            </div>
          </div>
        </header>

        <section className="viability-section">
          <div className="viability-card">
            <div className="viability-score">
              <div className={`score-circle ${getScoreColorClass(viability.score)}`}>
                <span className="score-number">{viability.score}</span>
                <span className="score-label">/100</span>
              </div>
              <div className="score-text">
                <h2>Viability Score</h2>
                <p>{getViabilityText(viability.score)}</p>
              </div>
            </div>

            <div className="signal-badge">
              <span className={`signal ${viability.signal}`}>
                {getSignalLabel(viability.signal)}
              </span>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Liquidity</span>
              <span className="stat-value">
                {getLiquidityLabel(viability.liquidity)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Risk Level</span>
              <span className="stat-value">{getRiskLabel(viability.risk)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Signal</span>
              <span className={`stat-value signal-${viability.signal}`}>
                {viability.signal.toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        <section className="market-data-section">
          <h2>Market Data</h2>
          <div className="data-grid">
            <div className="data-card">
              <span className="data-label">Market Cap</span>
              <span className="data-value">{formatCompact(coin.market_cap)}</span>
            </div>
            <div className="data-card">
              <span className="data-label">24h Volume</span>
              <span className="data-value">
                {formatCompact(coin.total_volume)}
              </span>
            </div>
            <div className="data-card">
              <span className="data-label">Circulating Supply</span>
              <span className="data-value">
                {formatCompact(coin.circulating_supply)} {coin.symbol.toUpperCase()}
              </span>
            </div>
            <div className="data-card">
              <span className="data-label">Total Supply</span>
              <span className="data-value">
                {coin.total_supply ? formatCompact(coin.total_supply) : "N/A"}
              </span>
            </div>
            <div className="data-card">
              <span className="data-label">ATH</span>
              <span className="data-value">{formatCurrency(coin.ath)}</span>
            </div>
            <div className="data-card">
              <span className="data-label">ATL</span>
              <span className="data-value">{formatCurrency(coin.atl)}</span>
            </div>
          </div>
        </section>

        <section className="indicators-section">
          <h2>Technical Indicators</h2>
          <div className="indicators-grid">
            <div className="indicator-card">
              <span className="indicator-label">50-Day MA</span>
              <span className="indicator-value">
                {indicators.sma50 ? formatCurrency(indicators.sma50) : "N/A"}
              </span>
            </div>
            <div className="indicator-card">
              <span className="indicator-label">200-Day MA</span>
              <span className="indicator-value">
                {indicators.sma200 ? formatCurrency(indicators.sma200) : "N/A"}
              </span>
            </div>
            <div className="indicator-card">
              <span className="indicator-label">RSI (14)</span>
              <span className={`indicator-value ${getRSIClass(indicators.rsi)}`}>
                {indicators.rsi ? indicators.rsi : "N/A"}
              </span>
            </div>
            <div className="indicator-card">
              <span className="indicator-label">Trend</span>
              <span className={`indicator-value trend-${indicators.trend}`}>
                {indicators.trend.toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <h2>Trading Analysis</h2>
          <div className="analysis-content">
            <div className="recommendation-box">
              <h3>Should You Buy?</h3>
              <div className={`recommendation ${viability.signal}`}>
                <span className="rec-text">{getRecText(viability.signal)}</span>
              </div>
            </div>

            <div className="reasons-list">
              <h3>Key Reasons</h3>
              <ul>
                {viability.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            <div className="trading-advice">
              <h3>Trading Advice</h3>
              <p>{getTradingAdvice(viability, coin)}</p>
            </div>
          </div>
        </section>

        <StrategyPlaybook coin={coin} />

        <div className="back-section">
          <Link href="/" className="back-button">
            Back to All Coins
          </Link>
        </div>
      </div>
    </div>
  );
}

function getScoreColorClass(score: number): string {
  if (score >= 70) return "excellent";
  if (score >= 50) return "good";
  if (score >= 30) return "average";
  return "poor";
}

function getViabilityText(score: number): string {
  if (score >= 80) return "Excellent trading potential";
  if (score >= 60) return "Good trading conditions";
  if (score >= 40) return "Moderate viability";
  if (score >= 20) return "Poor conditions";
  return "Not recommended";
}

function getRSIClass(rsi: number | null): string {
  if (rsi === null) return "";
  if (rsi > 70) return "overbought";
  if (rsi < 30) return "oversold";
  return "neutral";
}

function getRecText(signal: "buy" | "hold" | "avoid"): string {
  const texts = {
    buy: "BUY - Strong opportunity",
    hold: "HOLD - Wait for better entry",
    avoid: "AVOID - Unfavorable conditions",
  };
  return texts[signal];
}

function getTradingAdvice(
  viability: ReturnType<typeof calculateViability>,
  coin: {
    name: string;
    current_price: number;
    price_change_percentage_24h: number | null;
  },
): string {
  const { signal, score, risk } = viability;

  if (signal === "buy") {
    return `Consider buying ${coin.name} at current levels. With a viability score of ${score}/100 and ${risk} risk, this presents a good opportunity. Set a stop-loss at ${formatCurrency(coin.current_price * 0.95)} (5% below current price) to manage risk. Target a 10-15% gain for short-term trades.`;
  }

  if (signal === "hold") {
    return `${coin.name} shows neutral conditions. If you already own it, consider holding. For new positions, wait for a clearer signal or better entry point. Watch for a breakout above ${formatCurrency(coin.current_price * 1.05)} or support at ${formatCurrency(coin.current_price * 0.95)}.`;
  }

  return `Avoid entering ${coin.name} at current levels. The viability score of ${score}/100 suggests unfavorable conditions. If you own it, consider taking profits or setting a tight stop-loss. Wait for the score to improve above 50 before considering entry.`;
}
