import type {
  UsageBucket,
  UsageCosts,
  UsageMeasures,
} from "@/app/api/julia/model-usage/types";

export const TIMEZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";

// ---------------------------------------------------------------------------
// Derived measures (formulas from the dashboard-api skill, "Notas")
// ---------------------------------------------------------------------------

export function uncachedInputTokens(measures: UsageMeasures): number {
  return Math.max(
    0,
    measures.inputTokens -
      measures.cachedInputTokens -
      measures.cacheWriteTokens,
  );
}

export function totalTokens(measures: UsageMeasures): number {
  return measures.inputTokens + measures.outputTokens;
}

export function cacheRate(measures: UsageMeasures): number | null {
  return measures.inputTokens > 0
    ? measures.cachedInputTokens / measures.inputTokens
    : null;
}

export function errorRate(measures: UsageMeasures): number | null {
  return measures.requests > 0 ? measures.errors / measures.requests : null;
}

// ---------------------------------------------------------------------------
// Metric selectors of the charts
// ---------------------------------------------------------------------------

export type CostMetric = Extract<
  keyof UsageCosts,
  | "estimatedInferenceUsd"
  | "gatewayUsd"
  | "providerEstimatedUsd"
  | "gatewaySurchargeUsd"
>;

/** The recommended KPI of the contract comes first and is the default. */
export const DEFAULT_COST_METRIC: CostMetric = "estimatedInferenceUsd";

export const COST_METRIC_ORDER: CostMetric[] = [
  "estimatedInferenceUsd",
  "gatewayUsd",
  "providerEstimatedUsd",
  "gatewaySurchargeUsd",
];

export const COST_METRICS: Record<
  CostMetric,
  { label: string; tileLabel: string; description: string }
> = {
  estimatedInferenceUsd: {
    label: "Inferência estimada",
    tileLabel: "Inferência estimada",
    description:
      "Débito no Gateway + custo do provedor (BYOK) por chamada consultada; preço de referência enquanto a consulta estiver pendente.",
  },
  gatewayUsd: {
    label: "Débito no Gateway",
    tileLabel: "Débito no Gateway",
    description:
      "Débitos conhecidos no saldo do AI Gateway, adicionais inclusos.",
  },
  providerEstimatedUsd: {
    label: "Provedor (BYOK)",
    tileLabel: "Provedor (BYOK)",
    description:
      "Inferência com a credencial própria, a preço de tabela do provedor. Não inclui o armazenamento do cache.",
  },
  gatewaySurchargeUsd: {
    label: "Adicionais do Gateway",
    tileLabel: "Adicionais do Gateway",
    description:
      "Parcela de adicionais já contida no débito do Gateway; não somar de novo.",
  },
};

/** The two components that explain the selected cost, for the tile's detail line. */
export function costTileDetail(costs: UsageCosts, metric: CostMetric): string {
  switch (metric) {
    case "estimatedInferenceUsd":
      return `Gateway ${formatUsd(costs.gatewayUsd)} · provedor ${formatUsd(costs.providerEstimatedUsd)}`;
    case "gatewayUsd":
      return `Adicionais ${formatUsd(costs.gatewaySurchargeUsd)} · provedor ${formatUsd(costs.providerEstimatedUsd)}`;
    case "providerEstimatedUsd":
    case "gatewaySurchargeUsd":
      return `Gateway ${formatUsd(costs.gatewayUsd)} · inferência ${formatUsd(costs.estimatedInferenceUsd)}`;
  }
}

/** Calls whose cost is not final yet or is missing; `null` when every call is resolved. */
export function costCoverageIssues(costs: UsageCosts): string | null {
  const parts: string[] = [];
  if (costs.pendingRequests > 0) {
    parts.push(
      `${formatCount(costs.pendingRequests)} ${plural(costs.pendingRequests, "aguarda", "aguardam")} a consulta de cobrança`,
    );
  }
  if (costs.unavailableRequests > 0) {
    parts.push(
      `${formatCount(costs.unavailableRequests)} sem consulta possível`,
    );
  }
  if (costs.missingEstimateRequests > 0) {
    parts.push(
      `${formatCount(costs.missingEstimateRequests)} sem custo de referência (total incompleto)`,
    );
  }
  return parts.length ? parts.join(" · ") : null;
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export type TokenMetric =
  | "total"
  | "inputNoCache"
  | "cacheRead"
  | "cacheWrite"
  | "output"
  | "reasoning"
  | "cacheRate";

export interface TokenMetricConfig {
  label: string;
  kind: "count" | "rate";
  value: (measures: UsageMeasures) => number | null;
}

export const TOKEN_METRIC_ORDER: TokenMetric[] = [
  "total",
  "inputNoCache",
  "cacheRead",
  "cacheWrite",
  "output",
  "reasoning",
  "cacheRate",
];

export const TOKEN_METRICS: Record<TokenMetric, TokenMetricConfig> = {
  total: { label: "Todos os tokens", kind: "count", value: totalTokens },
  inputNoCache: {
    label: "Entrada sem cache",
    kind: "count",
    value: uncachedInputTokens,
  },
  cacheRead: {
    label: "Cache lido",
    kind: "count",
    value: (measures) => measures.cachedInputTokens,
  },
  cacheWrite: {
    label: "Cache gravado",
    kind: "count",
    value: (measures) => measures.cacheWriteTokens,
  },
  output: {
    label: "Saída",
    kind: "count",
    value: (measures) => measures.outputTokens,
  },
  reasoning: {
    label: "Raciocínio",
    kind: "count",
    value: (measures) => measures.reasoningTokens,
  },
  cacheRate: { label: "Taxa de cache", kind: "rate", value: cacheRate },
};

// Composition of the input tokens (stacked bars). Colors are @theme tokens in
// globals.css (`--color-cache-*`), validated together for color blindness.
export type CompositionKey = "cacheRead" | "cacheWrite" | "noCache";

export const COMPOSITION_KEYS: CompositionKey[] = [
  "cacheRead",
  "cacheWrite",
  "noCache",
];

export const COMPOSITION_SERIES: Record<
  CompositionKey,
  {
    label: string;
    color: string;
    swatchClass: string;
    value: (measures: UsageMeasures) => number;
  }
> = {
  cacheRead: {
    label: "Cache lido",
    color: "var(--color-cache-read)",
    swatchClass: "bg-cache-read",
    value: (measures) => measures.cachedInputTokens,
  },
  cacheWrite: {
    label: "Cache gravado",
    color: "var(--color-cache-write)",
    swatchClass: "bg-cache-write",
    value: (measures) => measures.cacheWriteTokens,
  },
  noCache: {
    label: "Sem cache",
    color: "var(--color-cache-none)",
    swatchClass: "bg-cache-none",
    value: uncachedInputTokens,
  },
};

// ---------------------------------------------------------------------------
// Formatters (pt-BR)
// ---------------------------------------------------------------------------

const usdFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdPreciseFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const countFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  maximumFractionDigits: 1,
});

const secondsFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
});

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value !== 0 && Math.abs(value) < 0.01) {
    return usdPreciseFormatter.format(value);
  }
  return usdFormatter.format(value);
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return countFormatter.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return compactFormatter.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return percentFormatter.format(value);
}

/** Storage of the prompt cache is billed in token-hours. */
export function formatTokenHours(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${compactFormatter.format(value)} tokens-hora`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${countFormatter.format(ms)} ms`;
  return `${secondsFormatter.format(ms / 1000)} s`;
}

// Bucket keys come as "YYYY-MM-DDTHH:mm" already in America/Sao_Paulo.
export function formatBucketTick(key: string, bucket: UsageBucket): string {
  const day = `${key.slice(8, 10)}/${key.slice(5, 7)}`;
  return bucket === "hour" ? `${day} ${key.slice(11, 13)}h` : day;
}

export function formatBucketLabel(key: string, bucket: UsageBucket): string {
  const day = `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`;
  return bucket === "hour" ? `${day} às ${key.slice(11, 16)}` : day;
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const clockFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** ISO instant → "dd/MM/yyyy às HH:mm" in America/Sao_Paulo. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${dateFormatter.format(date)} às ${timeFormatter.format(date)}`;
}

/** Instant → "HH:mm:ss" in America/Sao_Paulo. */
export function formatClock(value: number | string): string {
  return clockFormatter.format(new Date(value));
}

// ---------------------------------------------------------------------------
// Calendar dates in America/Sao_Paulo (for the custom range inputs)
// ---------------------------------------------------------------------------

export function todayInSaoPaulo(now: Date = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: TIMEZONE });
}

export function shiftDateOnly(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
