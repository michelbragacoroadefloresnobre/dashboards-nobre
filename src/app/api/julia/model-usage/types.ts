import type { JuliaAgent } from "@/lib/julia-agents";

// ---------------------------------------------------------------------------
// Report returned by SISTEMA_CFN_URL GET /api/v1/dashboard/julia/model-usage,
// normalized by GET /api/julia/model-usage (see `normalize.ts`) so the page
// always sees the version 2 cost accounting.
// Contract: .claude/skills/dashboard-api/SKILL.md, "API de Custos da Julia".
// ---------------------------------------------------------------------------

export type UsageBucket = "hour" | "day";

/**
 * Cost accounting of a group of calls (version 2). The Julia models run with
 * BYOK credentials, so the AI Gateway only debits its surcharges; the
 * inference itself is estimated at the provider's list price. Every amount is
 * a *known* subtotal: zero with pending/unavailable calls proves nothing.
 */
export interface UsageCosts {
  /** Debits known on the Gateway balance, queried later per generation. Surcharges included. */
  gatewayUsd: number;
  /** Part of `gatewayUsd` that is Gateway surcharge. A breakdown: never add it again. */
  gatewaySurchargeUsd: number;
  /** BYOK inference at list price, returned by the Gateway. Zero for calls made with Vercel credentials. */
  providerEstimatedUsd: number;
  /**
   * Recommended KPI. Per resolved call: `gatewayUsd + providerEstimatedUsd`;
   * while the billing query is pending/unavailable, the original `marketCostUsd`.
   */
  estimatedInferenceUsd: number;
  /** Calls whose billing query finished (not a reconciliation with the Google invoice). */
  resolvedRequests: number;
  /** Calls with a generation id still waiting for the query or a retry. */
  pendingRequests: number;
  /** Calls without generation id, or whose query exhausted its retries. */
  unavailableRequests: number;
  /** Pending/unavailable calls without a reference cost: they add nothing to `estimatedInferenceUsd`. */
  missingEstimateRequests: number;
}

export interface UsageMeasures {
  /** HTTP attempts to the AI Gateway; each tool-call step and each retry counts one. */
  requests: number;
  /** Attempts that ended in error. */
  errors: number;
  /** Distinct generateText/generateObject calls; one execution may have many attempts. */
  executions: number;
  /** Executions whose last attempt failed. */
  failedExecutions: number;
  /**
   * Cost reported by the Gateway in the initial response, never enriched
   * later. With BYOK it misses the inference and surcharges posted afterwards:
   * legacy field, use `costs` instead.
   */
  costUsd: number;
  /** Reference price reported in the initial response. Legacy field, use `costs` instead. */
  marketCostUsd: number;
  costs: UsageCosts;
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

/**
 * Storage of the shared prompt caches in the same start/end window. It covers
 * every Julia agent even when `agents` filters the report, and is not
 * allocated to agents, models or buckets: show it on its own, never add it to
 * a per-agent number.
 */
export interface SharedCacheStorage {
  scope: "all_julia_agents";
  allocation: "unallocated";
  /** Cache resources alive at some point of the period. */
  resources: number;
  tokenHours: number;
  /** Token-hours without a storage rate: the gap behind a null `estimatedUsd`. */
  unpricedTokenHours: number;
  /** Subtotal of the stretches that have a rate. */
  knownEstimatedUsd: number;
  /** null while some stretch lacks a rate or no resource was recorded yet. */
  estimatedUsd: number | null;
  /** Start of the recorded cache history; older caches are not reconstructed. */
  firstRecordedAt: string | null;
}

export interface CostAccounting {
  version: 2;
  basis: "gateway_billing_and_provider_list_prices";
  includesGoogleInvoiceAdjustments: false;
  sharedCacheStorage: SharedCacheStorage;
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
  /**
   * null while the main system still answers with the version 1 contract (no
   * `costs`): the `costs` objects are then synthesized from the legacy fields.
   */
  costAccounting: CostAccounting | null;
  totals: UsageMeasures & UsageLatency;
  /** Only agents with records in the period, in canonical order. */
  byAgent: UsageByAgent[];
  /** Only bucket × agent with data; fill the rest with 0 (and null for rates). */
  series: UsageSeriesPoint[];
  byModel: UsageByModel[];
  errors: UsageErrorRow[];
}
