"use client";

import Image from "next/image";
import Link from "next/link";
import { TradingRecommendation, TradingStrategy } from "../lib/trading";
import { formatCurrency, formatPercent } from "../lib/format";

interface TopFiveListProps {
  recommendations: TradingRecommendation[];
  strategy: TradingStrategy;
}

const strategyConfig: Record<"day" | "swing" | "safe", {
  icon: string;
  title: string;
  description: string;
}> = {
  day: {
    icon: "DT",
    title: "Day Trading",
    description: "High liquidity, tight spreads, quick moves",
  },
  swing: {
    icon: "SW",
    title: "Swing Trading",
    description: "Strong trends, momentum plays, 1-7 day holds",
  },
  safe: {
    icon: "SF",
    title: "Safe Picks",
    description: "Large cap stability, lower volatility, long-term",
  },
};

function getScoreLabel(score: number): string {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "poor";
}

export function TopFiveList({ recommendations, strategy }: TopFiveListProps) {
  const config = strategyConfig[strategy as "day" | "swing" | "safe"];

  return (
    <div className="top-five-section">
      <div className="top-five-header">
        <div className={`strategy-icon ${strategy}`}>
          {config.icon}
        </div>
        <div>
          <h3>{config.title}</h3>
          <p>{config.description}</p>
        </div>
      </div>

      <div className="top-five-grid">
        {recommendations.map((rec, index) => {
          const isWide = recommendations.length === 5 && index >= 3;

          return (
            <Link
              key={rec.coin.id}
              href={`/coin/${rec.coin.id}`}
              className={`top-five-card${isWide ? " wide" : ""}`}
            >
              <div className="card-rank">#{index + 1}</div>

              <div className="card-header">
                <Image
                  src={rec.coin.image}
                  alt={rec.coin.name}
                  width={40}
                  height={40}
                  className="card-image"
                />
                <div className="card-info">
                  <div className="card-name">{rec.coin.name}</div>
                  <div className="card-symbol">{rec.coin.symbol}</div>
                </div>
              </div>

              <div className="card-score">
                <span className="score-label">Score</span>
                <span className={`score-value ${getScoreLabel(rec.score)}`}>
                  {rec.score}/100
                </span>
              </div>

              <div className="card-metrics">
                <div className="card-metric">
                  <span className="card-metric-label">Price</span>
                  <span className="card-metric-value">
                    {formatCurrency(rec.coin.current_price)}
                  </span>
                </div>
                <div className="card-metric">
                  <span className="card-metric-label">24h</span>
                  <span
                    className="card-metric-value"
                    style={{
                      color:
                        (rec.coin.price_change_percentage_24h || 0) >= 0
                          ? "var(--positive)"
                          : "var(--negative)",
                    }}
                  >
                    {formatPercent(rec.coin.price_change_percentage_24h)}
                  </span>
                </div>
              </div>

              <div className="card-reason">{rec.reasons[0]}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
