"use client";

import type { OperationResponse } from "@/app/api/operation/types";
import { TEAM_COLORS, TEAM_EMOJIS, TEAMS, teamLabel } from "@/lib/teams";
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

const DEFAULT_COLOR = "#3B82F6";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
          {TEAM_EMOJIS[entry.name] ?? ""} {teamLabel(entry.name)}:{" "}
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

  // Build chart data: each date gets a row with SIENA/YORK as separate fields
  const dateMap = new Map<string, { SIENA?: number; YORK?: number }>();
  for (const d of data) {
    if (!dateMap.has(d.date)) {
      dateMap.set(d.date, {});
    }
    const entry = dateMap.get(d.date)!;
    if (d.team === "SIENA") entry.SIENA = d.invoice;
    if (d.team === "YORK") entry.YORK = d.invoice;
  }
  const chartData = Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));

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
                {emoji} {teamLabel(team)}
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
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
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
                dataKey="SIENA"
                name="SIENA"
                connectNulls
                stroke={TEAM_COLORS.SIENA}
                strokeWidth={3}
                fill="url(#fill-SIENA)"
                filter="url(#glow-main)"
                dot={{
                  r: 4,
                  fill: TEAM_COLORS.SIENA,
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: TEAM_COLORS.SIENA,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="YORK"
                name="YORK"
                connectNulls
                stroke={TEAM_COLORS.YORK}
                strokeWidth={3}
                fill="url(#fill-YORK)"
                filter="url(#glow-main)"
                dot={{
                  r: 4,
                  fill: TEAM_COLORS.YORK,
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: TEAM_COLORS.YORK,
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
