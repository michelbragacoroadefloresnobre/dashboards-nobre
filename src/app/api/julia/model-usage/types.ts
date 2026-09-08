import type { JuliaAgent } from "@/lib/julia-agents";

// ---------------------------------------------------------------------------
// Report returned by SISTEMA_CFN_URL GET /api/v1/dashboard/julia/model-usage
// and passed through unchanged by GET /api/julia/model-usage.
// Contract: .claude/skills/dashboard-api/SKILL.md, "API de Custos da Julia".
// ---------------------------------------------------------------------------

export type UsageBucket = "hour" | "day";

export interface UsageMeasures {
  /** HTTP attempts to the AI Gateway; each tool-call step and each retry counts one. */
  requests: number;
  /** Attempts that ended in error. */
  errors: number;
  /** Distinct generateText/generateObject calls; one execution may have many attempts. */
  executions: number;
  /** Executions whose last attempt failed. */
  failedExecutions: number;
  /** Billed by the gateway, in USD. Gemini is billed at US$ 0 in this account today. */
  costUsd: number;
  /** List price of the model, in USD: the number that reflects consumption while `costUsd` is zero. */
  marketCostUsd: number;
  /** Input tokens, cache included. */
  inputTokens: number;
  /** Part of the input read from the prompt cache. */
  cachedInputTokens: number;
  /** Part of the input written to the cache (only providers that report writes, like Anthropic). */
  cacheWriteTokens: number;
  /** Output tokens, reasoning included. */
  outputTokens: number;
  /** Part of the output spent on reasoning. */
  reasoningTokens: number;
}

export interface UsageLatency {
  /** Percentiles of the duration of successful attempts, in ms; null without successes. */
  p50DurationMs: number | null;
  p95DurationMs: number | null;
}

export interface UsageSeriesPoint extends UsageMeasures {
  /** Bucket key: "YYYY-MM-DDTHH:mm" in America/Sao_Paulo, without offset. */
  bucket: string;
  agent: JuliaAgent;
}

export interface UsageByAgent extends UsageMeasures, UsageLatency {
  agent: JuliaAgent;
}

export interface UsageByModel extends UsageMeasures, UsageLatency {
  agent: JuliaAgent;
  task: string | null;
  model: string;
  /** Final providers picked by the gateway in the period, e.g. "vertex" or "google, vertex". */
  providers: string | null;
}

export interface UsageErrorRow {
  agent: JuliaAgent;
  errorKind: string;
  errorStatusCode: number | null;
  count: number;
  lastAt: string;
  /** Message of the latest occurrence, truncated at 500 characters. */
  lastMessage: string | null;
}

export interface JuliaModelUsageReport {
  range: {
    start: string;
    end: string;
    bucket: UsageBucket;
    timezone: string;
    /** Every bucket key of the period, including the empty ones. */
    buckets: string[];
  };
  /** First row of the whole table (not of the period); null before any call is recorded. */
  firstRecordedAt: string | null;
  totals: UsageMeasures & UsageLatency;
  /** Only agents with records in the period, in canonical order. */
  byAgent: UsageByAgent[];
  /** Only bucket × agent with data; fill the rest with 0 (and null for rates). */
  series: UsageSeriesPoint[];
  byModel: UsageByModel[];
  errors: UsageErrorRow[];
}
