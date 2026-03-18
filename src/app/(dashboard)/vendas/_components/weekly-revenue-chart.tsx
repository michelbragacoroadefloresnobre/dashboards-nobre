"use client";

import { weeklyRevenueData } from "@/data/dashboard";
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

const BLUE_NEON = "#3B82F6";
const RED_NEON = "#EF4444";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#130B29]/95 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg px-3 py-2">
      <p className="text-[11px] font-semibold text-white/50 mb-1">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-[12px] font-semibold"
          style={{ color: entry.color }}
        >
          {entry.dataKey === "tulum" ? "🏁 Tulum" : "🚀 Equipe B"}:{" "}
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function WeeklyRevenueChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const chartData = weeklyRevenueData.map((d) => ({
    date: d.date,
    tulum: d.team === "tulum" ? d.invoice : null,
    equipeB: d.team === "equipeB" ? d.invoice : null,
  }));

  const todayTeam = weeklyRevenueData[weeklyRevenueData.length - 1]?.team;
  const todayTeamLastValue = [...weeklyRevenueData]
    .reverse()
    .find((d) => d.team === todayTeam)?.invoice ?? null;
  const refLineColor = todayTeam === "tulum" ? BLUE_NEON : RED_NEON;

  return (
    // Gradiente de fundo atualizado para tons de roxo bem escuro
    <div className="flex flex-col flex-1 min-h-0 bg-linear-to-br from-[#130B29]/95 via-[#25134A]/90 to-[#130B29]/95 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 pt-4 pb-1">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-white/60 flex items-center gap-2">
          <span className="text-[15px]">📈</span> Faturamento Semanal — Equipes
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[11px] text-white/50">
            <span
              className="w-2.5 h-0.75 rounded-full inline-block"
              style={{
                backgroundColor: BLUE_NEON,
                boxShadow: `0 0 6px ${BLUE_NEON}`,
              }}
            />{" "}
            🏁 Tulum
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/50">
            <span
              className="w-2.5 h-0.75 rounded-full inline-block"
              style={{
                backgroundColor: RED_NEON,
                boxShadow: `0 0 6px ${RED_NEON}`,
              }}
            />{" "}
            🚀 Equipe B
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-2 pb-3">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <filter id="glow-blue">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="fill-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE_NEON} stopOpacity={0.25} />
                  <stop
                    offset="100%"
                    stopColor={BLUE_NEON}
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="fill-red" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED_NEON} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={RED_NEON} stopOpacity={0.02} />
                </linearGradient>
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
              {todayTeamLastValue != null && (
                <ReferenceLine
                  y={todayTeamLastValue}
                  stroke={refLineColor}
                  strokeDasharray="6 4"
                  strokeOpacity={0.35}
                  strokeWidth={1.5}
                />
              )}
              <Area
                type="monotone"
                dataKey="tulum"
                connectNulls
                stroke={BLUE_NEON}
                strokeWidth={3}
                fill="url(#fill-blue)"
                filter="url(#glow-blue)"
                dot={{
                  r: 4,
                  fill: BLUE_NEON,
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: BLUE_NEON,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="equipeB"
                connectNulls
                stroke={RED_NEON}
                strokeWidth={3}
                fill="url(#fill-red)"
                filter="url(#glow-red)"
                dot={{
                  r: 4,
                  fill: RED_NEON,
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 6,
                  fill: RED_NEON,
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
