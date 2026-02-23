"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

type PriceData = {
  prices: [number, number][];
  total_volumes: [number, number][];
};

type TimeFrame = "1" | "7" | "30" | "180" | "365" | "1825" | "3650" | "max";

type PricePoint = {
  date: number;
  price: number;
};

const timeFrameLabels: Record<TimeFrame, string> = {
  "1": "1D",
  "7": "1W",
  "30": "1M",
  "180": "6M",
  "365": "1Y",
  "1825": "5Y",
  "3650": "10Y",
  max: "MAX",
};

export function PriceChart({ coinId, coinName }: { coinId: string; coinName: string }) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("30");
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when timeframe changes
  useMemo(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/historical?coinId=${coinId}&days=${timeFrame}`
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result);
      } catch {
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [coinId, timeFrame]);

  const chartData = useMemo<PricePoint[]>(() => {
    if (!data) return [];
    return data.prices.map((price) => ({
      date: price[0],
      price: price[1],
    }));
  }, [data]);

  const chartStats = useMemo(() => {
    if (chartData.length === 0) return null;

    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const high = Math.max(...chartData.map((point) => point.price));
    const low = Math.min(...chartData.map((point) => point.price));
    const changePercent =
      firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
    const spread = Math.max(high - low, high * 0.01);
    const padding = spread * 0.15;

    return {
      firstPrice,
      high,
      low,
      changePercent,
      yMin: Math.max(0, low - padding),
      yMax: high + padding,
    };
  }, [chartData]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };
  const lineColor =
    chartStats && chartStats.changePercent >= 0 ? "#10b981" : "#ef4444";
  const gradientId = `chart-gradient-${coinId}`;

  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-loading">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  if (!chartStats || chartData.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-error">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-block">
          <h3>{coinName} Price Chart</h3>
          <div className="chart-quick-stats">
            <span
              className={`chart-chip ${
                chartStats.changePercent >= 0 ? "positive" : "negative"
              }`}
            >
              {chartStats.changePercent >= 0 ? "+" : ""}
              {chartStats.changePercent.toFixed(2)}%
            </span>
            <span className="chart-chip">High {formatPrice(chartStats.high)}</span>
            <span className="chart-chip">Low {formatPrice(chartStats.low)}</span>
          </div>
        </div>
        <div className="timeframe-buttons">
          {(Object.keys(timeFrameLabels) as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`timeframe-btn ${timeFrame === tf ? "active" : ""}`}
            >
              {timeFrameLabels[tf]}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(100, 116, 139, 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(timestamp) => format(timestamp, "MMM d")}
              stroke="#64748b"
              fontSize={12}
              minTickGap={18}
            />
            <YAxis
              domain={[chartStats.yMin, chartStats.yMax]}
              tickFormatter={formatPrice}
              stroke="#64748b"
              fontSize={12}
              width={88}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pricePoint = payload[0].payload.price as number;
                  const movePercent =
                    chartStats.firstPrice > 0
                      ? ((pricePoint - chartStats.firstPrice) /
                          chartStats.firstPrice) *
                        100
                      : 0;

                  return (
                    <div className="chart-tooltip">
                      <div className="tooltip-date">
                        {format(payload[0].payload.date, "MMM d, yyyy HH:mm")}
                      </div>
                      <div className="tooltip-price">
                        Price: {formatPrice(pricePoint)}
                      </div>
                      <div
                        className={`tooltip-move ${
                          movePercent >= 0 ? "positive" : "negative"
                        }`}
                      >
                        Move: {movePercent >= 0 ? "+" : ""}
                        {movePercent.toFixed(2)}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={chartStats.firstPrice}
              stroke="rgba(100, 116, 139, 0.45)"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="none"
              fill={`url(#${gradientId})`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: lineColor,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
