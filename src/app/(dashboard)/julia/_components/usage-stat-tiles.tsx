import type {
  UsageLatency,
  UsageMeasures,
} from "@/app/api/julia/model-usage/types";
import {
  cacheRate,
  COST_METRICS,
  type CostMetric,
  errorRate,
  formatCompact,
  formatCount,
  formatDuration,
  formatPercent,
  formatUsd,
  totalTokens,
  uncachedInputTokens,
} from "./usage-format";

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border bg-bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]">
      <span className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
        {label}
      </span>
      <span className="font-display text-[26px] font-bold tracking-tight leading-none text-text-primary truncate">
        {value}
      </span>
      <span className="truncate text-xs text-text-secondary" title={detail}>
        {detail}
      </span>
    </div>
  );
}

interface UsageStatTilesProps {
  totals: UsageMeasures & UsageLatency;
  costMetric: CostMetric;
}

export function UsageStatTiles({ totals, costMetric }: UsageStatTilesProps) {
  const otherCost: CostMetric =
    costMetric === "costUsd" ? "marketCostUsd" : "costUsd";

  return (
    <div className="grid grid-cols-3 gap-4 2xl:grid-cols-6">
      <StatTile
        label={COST_METRICS[costMetric].tileLabel}
        value={formatUsd(totals[costMetric])}
        detail={`${COST_METRICS[otherCost].label} ${formatUsd(totals[otherCost])}`}
      />
      <StatTile
        label="Requisições"
        value={formatCount(totals.requests)}
        detail={`${formatCount(totals.executions)} execuções`}
      />
      <StatTile
        label="Taxa de erro"
        value={formatPercent(errorRate(totals))}
        detail={`${formatCount(totals.errors)} erros · ${formatCount(totals.failedExecutions)} execuções falharam`}
      />
      <StatTile
        label="Tokens"
        value={formatCompact(totalTokens(totals))}
        detail={`Entrada ${formatCompact(totals.inputTokens)} · saída ${formatCompact(totals.outputTokens)}`}
      />
      <StatTile
        label="Cache de prompt"
        value={formatPercent(cacheRate(totals))}
        detail={`${formatCompact(totals.cachedInputTokens)} do cache · ${formatCompact(uncachedInputTokens(totals))} sem cache`}
      />
      <StatTile
        label="Latência p50"
        value={formatDuration(totals.p50DurationMs)}
        detail={`p95 ${formatDuration(totals.p95DurationMs)}`}
      />
    </div>
  );
}
