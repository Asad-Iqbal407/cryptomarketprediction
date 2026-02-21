"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from "recharts";
import { format } from "date-fns";

type PriceData = {
  prices: [number, number][];
  total_volumes: [number, number][];
};

type TimeFrame = "1" | "7" | "30" | "180" | "365" | "1825" | "3650" | "max";

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
      } catch (err) {
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [coinId, timeFrame]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.prices.map((price, index) => ({
      date: price[0],
      price: price[1],
      volume: data.total_volumes[index]?.[1] || 0,
    }));
  }, [data]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };

  const formatVolume = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

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

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{coinName} Price Chart</h3>
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
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={(timestamp) => format(timestamp, "MMM d")}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tickFormatter={formatPrice}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tickFormatter={formatVolume}
              stroke="#9ca3af"
              fontSize={10}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="chart-tooltip">
                      <div className="tooltip-date">
                        {format(payload[0].payload.date, "MMM d, yyyy HH:mm")}
                      </div>
                      <div className="tooltip-price">
                        Price: {formatPrice(payload[0].payload.price)}
                      </div>
                      <div className="tooltip-volume">
                        Volume: {formatVolume(payload[0].payload.volume)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#e5e7eb"
              opacity={0.3}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
