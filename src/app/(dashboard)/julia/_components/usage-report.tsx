"use client";

import type {
  JuliaModelUsageReport,
  UsageSeriesPoint,
} from "@/app/api/julia/model-usage/types";
import type { JuliaAgent } from "@/lib/julia-agents";
import { useMemo } from "react";
import {
  AgentLineChart,
  type AgentSeriesRow,
  type CompositionRow,
  InputCompositionChart,
} from "./usage-charts";
import { UsageEmptyState } from "./usage-empty-state";
import {
  cacheRate,
  COMPOSITION_KEYS,
  COMPOSITION_SERIES,
  COST_METRIC_ORDER,
  COST_METRICS,
  type CostMetric,
  errorRate,
  formatCompact,
  formatCount,
  formatDateTime,
  formatPercent,
  formatUsd,
  TOKEN_METRIC_ORDER,
  TOKEN_METRICS,
  type TokenMetric,
} from "./usage-format";
import { UsageCostCard } from "./usage-cost-card";
import { Notice } from "./usage-notice";
import { UsageStatTiles } from "./usage-stat-tiles";
import { UsageByModelTable, UsageErrorsTable } from "./usage-tables";

// ---------------------------------------------------------------------------
// Series → chart rows. `series` only has bucket × agent with data, so every
// bucket of the range is filled: 0 for counts, null for rates (a gap, not 0%).
// ---------------------------------------------------------------------------

function indexSeries(report: JuliaModelUsageReport) {
  return new Map(
    report.series.map((point) => [`${point.bucket}|${point.agent}`, point]),
  );
}

function agentRows(
  report: JuliaModelUsageReport,
  agents: JuliaAgent[],
  metric: (point: UsageSeriesPoint) => number | null,
  missing: number | null,
): AgentSeriesRow[] {
  const index = indexSeries(report);
  return report.range.buckets.map((bucket) => {
    const row: AgentSeriesRow = { bucket };
    for (const agent of agents) {
      const point = index.get(`${bucket}|${agent}`);
      row[agent] = point ? metric(point) : missing;
    }
    return row;
  });
}

function compositionRows(
  report: JuliaModelUsageReport,
  agents: JuliaAgent[],
): CompositionRow[] {
  const index = indexSeries(report);
  return report.range.buckets.map((bucket) => {
    const row: CompositionRow = {
      bucket,
      cacheRead: 0,
      cacheWrite: 0,
      noCache: 0,
    };
    for (const agent of agents) {
      const point = index.get(`${bucket}|${agent}`);
      if (!point) continue;
      for (const key of COMPOSITION_KEYS) {
        row[key] += COMPOSITION_SERIES[key].value(point);
      }
    }
    return row;
  });
}

function MetricSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="cursor-pointer rounded-lg border border-border bg-bg-card-alt px-2 py-1 text-[11px] font-medium text-text-secondary outline-none transition-colors hover:text-text-primary focus:border-accent-green"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const COST_OPTIONS = COST_METRIC_ORDER.map((metric) => ({
  value: metric,
  label: COST_METRICS[metric].label,
}));

const TOKEN_OPTIONS = TOKEN_METRIC_ORDER.map((metric) => ({
  value: metric,
  label: TOKEN_METRICS[metric].label,
}));

export interface UsageReportProps {
  report: JuliaModelUsageReport;
  /** Agents drawn on the charts: the selection, or every agent. */
  agents: JuliaAgent[];
  /** The shared cache storage may only be added to the total with every agent selected. */
  allAgentsSelected: boolean;
  costMetric: CostMetric;
  onCostMetricChange: (metric: CostMetric) => void;
  tokenMetric: TokenMetric;
  onTokenMetricChange: (metric: TokenMetric) => void;
}

export function UsageReport({
  report,
  agents,
  allAgentsSelected,
  costMetric,
  onCostMetricChange,
  tokenMetric,
  onTokenMetricChange,
}: UsageReportProps) {
  const tokenConfig = TOKEN_METRICS[tokenMetric];
  const isRate = tokenConfig.kind === "rate";

  const costRows = useMemo(
    () => agentRows(report, agents, (point) => point.costs[costMetric], 0),
    [report, agents, costMetric],
  );
  const requestRows = useMemo(
    () => agentRows(report, agents, (point) => point.requests, 0),
    [report, agents],
  );
  const errorRateRows = useMemo(
    () => agentRows(report, agents, errorRate, null),
    [report, agents],
  );
  const tokenRows = useMemo(
    () => agentRows(report, agents, tokenConfig.value, isRate ? null : 0),
    [report, agents, tokenConfig, isRate],
  );
  const inputRows = useMemo(
    () => compositionRows(report, agents),
    [report, agents],
  );

  if (report.totals.requests === 0) {
    return (
      <>
        <UsageStatTiles totals={report.totals} costMetric={costMetric} />
        <UsageEmptyState firstRecordedAt={report.firstRecordedAt} />
      </>
    );
  }

  // Tracking started inside the period: earlier buckets are zero because
  // nothing was recorded yet, not because nothing ran.
  const trackingStartedInside =
    report.firstRecordedAt !== null &&
    Date.parse(report.firstRecordedAt) > Date.parse(report.range.start);

  const totalCacheRate = cacheRate(report.totals);
  const bucket = report.range.bucket;

  return (
    <>
      <UsageStatTiles totals={report.totals} costMetric={costMetric} />

      {report.costAccounting === null && (
        <Notice tone="info" title="Contabilidade de custos antiga">
          O sistema principal ainda responde sem o detalhamento de custos
          (versão 2): os valores usam o preço de referência do Gateway, sem os
          adicionais lançados depois nem o armazenamento do cache.
        </Notice>
      )}

      <UsageCostCard
        costs={report.totals.costs}
        requests={report.totals.requests}
        costAccounting={report.costAccounting}
        allAgentsSelected={allAgentsSelected}
        rangeStart={report.range.start}
      />

      {trackingStartedInside && (
        <Notice tone="info" title="Registro parcial">
          O registro começou em {formatDateTime(report.firstRecordedAt)}; antes
          disso não havia rastreamento, por isso o início do período fica
          zerado.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
        <AgentLineChart
          title="Custo por agente"
          headline={formatUsd(report.totals.costs[costMetric])}
          control={
            <MetricSelect
              label="Métrica de custo"
              value={costMetric}
              options={COST_OPTIONS}
              onChange={onCostMetricChange}
            />
          }
          rows={costRows}
          agents={agents}
          bucket={bucket}
          format={formatUsd}
          tickFormat={formatUsd}
          decimals
          yAxisWidth={72}
        />
        <AgentLineChart
          title="Requisições por agente"
          headline={formatCount(report.totals.requests)}
          rows={requestRows}
          agents={agents}
          bucket={bucket}
          format={formatCount}
          tickFormat={formatCompact}
        />
        <AgentLineChart
          title="Taxa de erro por agente"
          headline={formatPercent(errorRate(report.totals))}
          rows={errorRateRows}
          agents={agents}
          bucket={bucket}
          format={formatPercent}
          tickFormat={formatPercent}
          decimals
        />
        <AgentLineChart
          title="Tokens por agente"
          headline={
            isRate
              ? formatPercent(totalCacheRate)
              : formatCompact(tokenConfig.value(report.totals) ?? 0)
          }
          control={
            <MetricSelect
              label="Métrica de tokens"
              value={tokenMetric}
              options={TOKEN_OPTIONS}
              onChange={onTokenMetricChange}
            />
          }
          rows={tokenRows}
          agents={agents}
          bucket={bucket}
          format={isRate ? formatPercent : formatCount}
          tickFormat={isRate ? formatPercent : formatCompact}
          decimals={isRate}
        />
      </div>

      <InputCompositionChart
        title="Composição da entrada"
        headline={
          totalCacheRate === null
            ? "Sem tokens de entrada no período"
            : `${formatPercent(totalCacheRate)} da entrada veio do cache`
        }
        rows={inputRows}
        bucket={bucket}
      />

      <UsageByModelTable rows={report.byModel} />
      <UsageErrorsTable rows={report.errors} />
    </>
  );
}
