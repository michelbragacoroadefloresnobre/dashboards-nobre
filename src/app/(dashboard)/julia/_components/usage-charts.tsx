"use client";

import type { UsageBucket } from "@/app/api/julia/model-usage/types";
import {
  JULIA_AGENT_COLORS,
  JULIA_AGENT_LABELS,
  JULIA_AGENT_SWATCH_CLASS,
  type JuliaAgent,
} from "@/lib/julia-agents";
import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  COMPOSITION_KEYS,
  COMPOSITION_SERIES,
  type CompositionKey,
  formatBucketLabel,
  formatBucketTick,
  formatCompact,
  formatCount,
} from "./usage-format";

export type AgentSeriesRow = { bucket: string } & Partial<
  Record<JuliaAgent, number | null>
>;

export type CompositionRow = { bucket: string } & Record<
  CompositionKey,
  number
>;

type KeyShape = "line" | "rect";
type ViewMode = "chart" | "table";

// Chart chrome: hairline solid grid one step off the surface, 2px lines,
// 8px active markers with a surface ring, bars capped at 24px with a surface
// gap between stacked segments.
const GRID_STROKE = "var(--color-border-light)";
const AXIS_STROKE = "var(--color-border)";
const SURFACE = "var(--color-bg-card)";
const TICK_STYLE = { fontSize: 11, fill: "var(--color-text-muted)" };
const TOP_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

// With `responsive`, Recharts sizes the chart from its wrapper's CSS box and
// re-measures on resize, so the box is fixed here and the SVG follows it.
const CHART_CLASS = "h-60 w-full";

export interface LegendItem {
  key: string;
  label: string;
  swatchClass: string;
}

const AGENT_SWATCHES: Record<string, string> = JULIA_AGENT_SWATCH_CLASS;
const COMPOSITION_SWATCHES: Record<string, string> = Object.fromEntries(
  COMPOSITION_KEYS.map((key) => [key, COMPOSITION_SERIES[key].swatchClass]),
);

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function SeriesKey({
  swatchClass,
  shape,
}: {
  swatchClass: string;
  shape: KeyShape;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 ${
        shape === "line" ? "h-0.5 w-3.5 rounded-full" : "size-2.5 rounded-[3px]"
      } ${swatchClass}`}
    />
  );
}

function ChartLegend({
  items,
  shape,
}: {
  items: LegendItem[];
  shape: KeyShape;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-text-secondary">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <SeriesKey swatchClass={item.swatchClass} shape={shape} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// Recharts clones this element with the active state of the chart.
type TooltipItem = {
  name?: string | number;
  value?: unknown;
  dataKey?: string | number;
};

interface UsageTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipItem>;
  label?: string | number;
  bucket: UsageBucket;
  format: (value: number | null) => string;
  swatches: Record<string, string>;
  shape: KeyShape;
  totalLabel?: string;
}

function UsageTooltip({
  active,
  payload,
  label,
  bucket,
  format,
  swatches,
  shape,
  totalLabel,
}: UsageTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce(
    (sum, item) => sum + (toNumber(item.value) ?? 0),
    0,
  );

  return (
    <div className="min-w-[210px] rounded-xl border border-border bg-bg-card px-3 py-2.5 text-xs shadow-lg">
      <div className="mb-1.5 font-semibold text-text-secondary">
        {formatBucketLabel(String(label ?? ""), bucket)}
      </div>
      <ul className="flex flex-col gap-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "");
          return (
            <li key={key} className="flex items-center gap-2">
              <SeriesKey
                swatchClass={swatches[key] ?? "bg-text-muted"}
                shape={shape}
              />
              <span className="text-text-secondary">{item.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-text-primary">
                {format(toNumber(item.value))}
              </span>
            </li>
          );
        })}
      </ul>
      {totalLabel && (
        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border-light pt-1.5">
          <span className="text-text-secondary">{totalLabel}</span>
          <span className="font-semibold tabular-nums text-text-primary">
            {format(total)}
          </span>
        </div>
      )}
    </div>
  );
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "chart", label: "Gráfico" },
  { value: "table", label: "Tabela" },
];

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Modo de exibição"
      className="inline-flex rounded-lg border border-border bg-bg-card-alt p-0.5"
    >
      {VIEW_OPTIONS.map((option) => {
        const active = option.value === view;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              active
                ? "bg-bg-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  headline: string;
  control?: ReactNode;
  legend: LegendItem[];
  shape: KeyShape;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  children: ReactNode;
}

function ChartCard({
  title,
  headline,
  control,
  legend,
  shape,
  view,
  onViewChange,
  children,
}: ChartCardProps) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col rounded-2xl border border-border bg-bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary">
            {title}
          </h2>
          <p className="mt-1 font-display text-[22px] font-bold leading-tight tracking-tight text-text-primary">
            {headline}
          </p>
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      <div className="px-3 pb-2 pt-3">{children}</div>
      <div className="flex items-center justify-between gap-3 px-5 pb-4">
        <ChartLegend items={legend} shape={shape} />
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
    </section>
  );
}

type TableRow = { bucket: string } & Record<string, unknown>;

// Table twin of each chart: the same rows, readable without hovering.
function SeriesTable({
  rows,
  columns,
  bucket,
  format,
}: {
  rows: ReadonlyArray<TableRow>;
  columns: LegendItem[];
  bucket: UsageBucket;
  format: (value: number | null) => string;
}) {
  return (
    <div className="h-60 overflow-auto rounded-xl border border-border-light">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-bg-card-alt">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-text-muted">
              Período
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap px-3 py-2 text-right font-medium text-text-muted"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {rows.map((row) => (
            <tr key={row.bucket}>
              <td className="whitespace-nowrap px-3 py-1.5 text-text-secondary">
                {formatBucketLabel(row.bucket, bucket)}
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-3 py-1.5 text-right tabular-nums text-text-primary"
                >
                  {format(toNumber(row[column.key]))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function bucketTickFormatter(bucket: UsageBucket) {
  return (value: string) => formatBucketTick(value, bucket);
}

interface AgentLineChartProps {
  title: string;
  headline: string;
  control?: ReactNode;
  rows: AgentSeriesRow[];
  agents: JuliaAgent[];
  bucket: UsageBucket;
  format: (value: number | null) => string;
  tickFormat: (value: number) => string;
  /** Whether the Y axis may use fractional ticks (money, rates). */
  decimals?: boolean;
  yAxisWidth?: number;
}

export function AgentLineChart({
  title,
  headline,
  control,
  rows,
  agents,
  bucket,
  format,
  tickFormat,
  decimals = false,
  yAxisWidth = 56,
}: AgentLineChartProps) {
  const [view, setView] = useState<ViewMode>("chart");
  const legend: LegendItem[] = agents.map((agent) => ({
    key: agent,
    label: JULIA_AGENT_LABELS[agent],
    swatchClass: JULIA_AGENT_SWATCH_CLASS[agent],
  }));

  return (
    <ChartCard
      title={title}
      headline={headline}
      control={control}
      legend={legend}
      shape="line"
      view={view}
      onViewChange={setView}
    >
      {view === "table" ? (
        <SeriesTable
          rows={rows}
          columns={legend}
          bucket={bucket}
          format={format}
        />
      ) : (
        <LineChart
          responsive
          className={CHART_CLASS}
          data={rows}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={{ stroke: AXIS_STROKE }}
              tickMargin={8}
              minTickGap={32}
              tick={TICK_STYLE}
              tickFormatter={bucketTickFormatter(bucket)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={yAxisWidth}
              domain={[0, "auto"]}
              allowDecimals={decimals}
              tick={TICK_STYLE}
              tickFormatter={tickFormat}
            />
            <Tooltip
              cursor={{ stroke: AXIS_STROKE, strokeWidth: 1 }}
              isAnimationActive={false}
              content={
                <UsageTooltip
                  bucket={bucket}
                  format={format}
                  swatches={AGENT_SWATCHES}
                  shape="line"
                />
              }
            />
            {agents.map((agent) => (
              <Line
                key={agent}
                type="monotone"
                dataKey={agent}
                name={JULIA_AGENT_LABELS[agent]}
                stroke={JULIA_AGENT_COLORS[agent]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: JULIA_AGENT_COLORS[agent],
                  stroke: SURFACE,
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
        </LineChart>
      )}
    </ChartCard>
  );
}

interface InputCompositionChartProps {
  title: string;
  headline: string;
  rows: CompositionRow[];
  bucket: UsageBucket;
}

export function InputCompositionChart({
  title,
  headline,
  rows,
  bucket,
}: InputCompositionChartProps) {
  const [view, setView] = useState<ViewMode>("chart");
  const legend: LegendItem[] = COMPOSITION_KEYS.map((key) => ({
    key,
    label: COMPOSITION_SERIES[key].label,
    swatchClass: COMPOSITION_SERIES[key].swatchClass,
  }));

  return (
    <ChartCard
      title={title}
      headline={headline}
      legend={legend}
      shape="rect"
      view={view}
      onViewChange={setView}
    >
      {view === "table" ? (
        <SeriesTable
          rows={rows}
          columns={legend}
          bucket={bucket}
          format={formatCount}
        />
      ) : (
        <BarChart
          responsive
          className={CHART_CLASS}
          data={rows}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={{ stroke: AXIS_STROKE }}
              tickMargin={8}
              minTickGap={32}
              tick={TICK_STYLE}
              tickFormatter={bucketTickFormatter(bucket)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              allowDecimals={false}
              tick={TICK_STYLE}
              tickFormatter={formatCompact}
            />
            <Tooltip
              cursor={{ fill: "var(--color-bg-card-alt)" }}
              isAnimationActive={false}
              content={
                <UsageTooltip
                  bucket={bucket}
                  format={formatCount}
                  swatches={COMPOSITION_SWATCHES}
                  shape="rect"
                  totalLabel="Entrada total"
                />
              }
            />
            {COMPOSITION_KEYS.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                name={COMPOSITION_SERIES[key].label}
                stackId="input"
                fill={COMPOSITION_SERIES[key].color}
                stroke={SURFACE}
                strokeWidth={1}
                maxBarSize={24}
                radius={index === COMPOSITION_KEYS.length - 1 ? TOP_RADIUS : 0}
                isAnimationActive={false}
              />
            ))}
        </BarChart>
      )}
    </ChartCard>
  );
}
