"use client";

import type { OperationResponse } from "@/app/api/operation/types";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TEAM_COLORS: Record<string, string> = {
  tulum: "#EF4444",
  dubai: "#3B82F6",
};
const DEFAULT_COLOR = "#3B82F6";

const TEAM_EMOJIS: Record<string, string> = {
  tulum: "🏁",
  dubai: "🚀",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TEAMS = ["tulum", "dubai"] as const;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; color: string; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const entries = payload.filter((e) => e.value != null);
  if (!entries.length) return null;

  return (
    <div className="bg-[#130B29]/95 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg px-3 py-2">
      <p className="text-[11px] font-semibold text-white/50 mb-1">{label}</p>
      {entries.map((entry, i) => (
        <p
          key={i}
          className="text-[12px] font-semibold"
          style={{ color: entry.color }}
        >
          {TEAM_EMOJIS[entry.name] ?? ""}{" "}
          {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}:{" "}
          {formatCurrency(entry.value!)}
        </p>
      ))}
    </div>
  );
}

interface WeeklyRevenueChartProps {
  data: OperationResponse["weeklyRevenueChart"];
}

export function WeeklyRevenueChart({ data }: WeeklyRevenueChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Build chart data: each date gets a row with tulum/dubai as separate fields
  const dateMap = new Map<
    string,
    { tulum?: number; dubai?: number }
  >();
  for (const d of data) {
    if (!dateMap.has(d.date)) {
      dateMap.set(d.date, {});
    }
    const entry = dateMap.get(d.date)!;
    if (d.team === "tulum") entry.tulum = d.invoice;
    if (d.team === "dubai") entry.dubai = d.invoice;
  }
  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));

  // Reference line: last entry = today's team
  const lastEntry = data[data.length - 1];
  const refValue = lastEntry?.invoice ?? null;
  const refColor = TEAM_COLORS[lastEntry?.team] ?? DEFAULT_COLOR;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-linear-to-br from-[#130B29]/95 via-[#25134A]/90 to-[#130B29]/95 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 pt-4 pb-1">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-white/60 flex items-center gap-2">
          <span className="text-[15px]">📈</span> Faturamento Semanal
        </div>
        <div className="flex items-center gap-4 mt-2">
          {TEAMS.map((team) => {
            const color = TEAM_COLORS[team] ?? DEFAULT_COLOR;
            const emoji = TEAM_EMOJIS[team] ?? "🏁";
            return (
              <span
                key={team}
                className="flex items-center gap-1.5 text-[11px] text-white/50"
              >
                <span
                  className="w-2.5 h-0.75 rounded-full inline-block"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />{" "}
                {emoji} {team.charAt(0).toUpperCase() + team.slice(1)}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 px-2 pb-3">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {TEAMS.map((team) => {
                  const color = TEAM_COLORS[team] ?? DEFAULT_COLOR;
                  return (
                    <linearGradient
                      key={team}
                      id={`fill-${team}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={color}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor={color}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  );
                })}
                <filter id="glow-main">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={35}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {refValue != null && (
                <ReferenceLine
                  y={refValue}
                  stroke={refColor}
                  strokeDasharray="6 4"
                  strokeOpacity={0.35}
                  strokeWidth={1.5}
                />
              )}
              <Area
                type="monotone"
                dataKey="tulum"
                name="tulum"
                connectNulls
                stroke={TEAM_COLORS.tulum}
                strokeWidth={3}
                fill="url(#fill-tulum)"
                filter="url(#glow-main)"
                dot={{
                  r: 4,
                  fill: TEAM_COLORS.tulum,
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: TEAM_COLORS.tulum,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="dubai"
                name="dubai"
                connectNulls
                stroke={TEAM_COLORS.dubai}
                strokeWidth={3}
                fill="url(#fill-dubai)"
                filter="url(#glow-main)"
                dot={{
                  r: 4,
                  fill: TEAM_COLORS.dubai,
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: TEAM_COLORS.dubai,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
