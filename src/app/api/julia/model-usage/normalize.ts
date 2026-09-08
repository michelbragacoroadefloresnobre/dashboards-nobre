import type {
  CostAccounting,
  JuliaModelUsageReport,
  UsageByAgent,
  UsageByModel,
  UsageCosts,
  UsageMeasures,
  UsageSeriesPoint,
} from "./types";

// ---------------------------------------------------------------------------
// The main system is deployed separately from this dashboard. During the
// transition between its versions the report may still follow the version 1
// contract (no `costs`, no `costAccounting`), detected by
// `costAccounting?.version === 2`. Everything the page renders assumes version
// 2, so this is the only place that knows about the old shape.
// ---------------------------------------------------------------------------

type RawMeasures<T extends UsageMeasures> = Omit<T, "costs"> & {
  costs?: UsageCosts;
};

export type RawJuliaModelUsageReport = Omit<
  JuliaModelUsageReport,
  "costAccounting" | "totals" | "byAgent" | "series" | "byModel"
> & {
  costAccounting?: CostAccounting | { version?: unknown };
  totals: RawMeasures<JuliaModelUsageReport["totals"]>;
  byAgent: RawMeasures<UsageByAgent>[];
  series: RawMeasures<UsageSeriesPoint>[];
  byModel: RawMeasures<UsageByModel>[];
};

/**
 * Version 1 never queried the Gateway billing, so every call is treated as
 * pending and the KPI falls back to the initial reference price, exactly what
 * version 2 does for its own pending calls. `costUsd` is kept as the only
 * known Gateway debit.
 */
function legacyCosts(measures: RawMeasures<UsageMeasures>): UsageCosts {
  return {
    gatewayUsd: measures.costUsd,
    gatewaySurchargeUsd: 0,
    providerEstimatedUsd: 0,
    estimatedInferenceUsd: measures.marketCostUsd,
    resolvedRequests: 0,
    pendingRequests: measures.requests,
    unavailableRequests: 0,
    missingEstimateRequests:
      measures.marketCostUsd > 0 ? 0 : measures.requests,
  };
}

function withCosts<T extends UsageMeasures>(measures: RawMeasures<T>): T {
  return {
    ...measures,
    costs: measures.costs ?? legacyCosts(measures),
  } as T;
}

function isCostAccountingV2(value: unknown): value is CostAccounting {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { version?: unknown }).version === 2
  );
}

export function normalizeUsageReport(
  raw: RawJuliaModelUsageReport,
): JuliaModelUsageReport {
  return {
    ...raw,
    costAccounting: isCostAccountingV2(raw.costAccounting)
      ? raw.costAccounting
      : null,
    totals: withCosts(raw.totals),
    byAgent: raw.byAgent.map(withCosts),
    series: raw.series.map(withCosts),
    byModel: raw.byModel.map(withCosts),
  };
}
