import { isJuliaAgent, JULIA_AGENTS, type JuliaAgent } from "@/lib/julia-agents";

// ---------------------------------------------------------------------------
// Filters of the "Relatório da Julia" page. They are the contract between the
// URL (?periodo=7d&inicio=…&fim=…&agentes=…), the page and the internal route
// GET /api/julia/model-usage, which turns them into the start/end window the
// main system expects. Everything here runs on both sides and knows nothing
// about timezones; the America/Sao_Paulo resolution lives in `range.ts`.
// ---------------------------------------------------------------------------

export const PERIOD_PRESETS = ["12h", "24h", "7d", "30d", "custom"] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];
export type RollingPreset = Exclude<PeriodPreset, "custom">;

export const DEFAULT_PRESET: PeriodPreset = "7d";

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  "12h": "Últimas 12 horas",
  "24h": "Últimas 24 horas",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  custom: "Personalizado",
};

export const ROLLING_PRESET_HOURS: Record<RollingPreset, number> = {
  "12h": 12,
  "24h": 24,
  "7d": 7 * 24,
  "30d": 30 * 24,
};

// Same limit as the main system, which answers 400 for longer windows.
export const MAX_RANGE_DAYS = 92;

export const FILTER_PARAMS = {
  preset: "periodo",
  start: "inicio",
  end: "fim",
  agents: "agentes",
} as const;

export interface UsageFilters {
  preset: PeriodPreset;
  /** Inclusive dates ("YYYY-MM-DD") in America/Sao_Paulo; only used with preset "custom". */
  customStart: string;
  customEnd: string;
  /** Empty = all agents. */
  agents: JuliaAgent[];
}

export function isPeriodPreset(
  value: string | null | undefined,
): value is PeriodPreset {
  return (PERIOD_PRESETS as readonly string[]).includes(value ?? "");
}

export function isRollingPreset(preset: PeriodPreset): preset is RollingPreset {
  return preset !== "custom";
}

/** `YYYY-MM-DD` that exists in the calendar. */
export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function parseAgentsParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Canonical order, no duplicates; selecting every agent collapses to "all" (empty). */
export function normalizeAgents(agents: readonly JuliaAgent[]): JuliaAgent[] {
  const selected = new Set(agents);
  if (selected.size === 0 || selected.size >= JULIA_AGENTS.length) return [];
  return JULIA_AGENTS.filter((agent) => selected.has(agent));
}

/** Lenient read for the page: unknown values fall back to the defaults. */
export function readUsageFilters(
  params: URLSearchParams,
  fallbackRange: { start: string; end: string },
): UsageFilters {
  const preset = params.get(FILTER_PARAMS.preset);
  const start = params.get(FILTER_PARAMS.start) ?? "";
  const end = params.get(FILTER_PARAMS.end) ?? "";
  return {
    preset: isPeriodPreset(preset) ? preset : DEFAULT_PRESET,
    customStart: isDateOnly(start) ? start : fallbackRange.start,
    customEnd: isDateOnly(end) ? end : fallbackRange.end,
    agents: normalizeAgents(
      parseAgentsParam(params.get(FILTER_PARAMS.agents)).filter(isJuliaAgent),
    ),
  };
}

export function serializeUsageFilters(filters: UsageFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set(FILTER_PARAMS.preset, filters.preset);
  if (filters.preset === "custom") {
    params.set(FILTER_PARAMS.start, filters.customStart);
    params.set(FILTER_PARAMS.end, filters.customEnd);
  }
  const agents = normalizeAgents(filters.agents);
  if (agents.length) params.set(FILTER_PARAMS.agents, agents.join(","));
  return params;
}

/** Days covered by an inclusive `YYYY-MM-DD` interval. */
export function customRangeDays(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

/** Validation shared by the page and the route; `null` when the range is usable. */
export function customRangeError(start: string, end: string): string | null {
  if (!isDateOnly(start) || !isDateOnly(end)) {
    return "Informe uma data inicial e uma data final válidas.";
  }
  if (start > end) {
    return "A data inicial precisa ser igual ou anterior à data final.";
  }
  if (customRangeDays(start, end) > MAX_RANGE_DAYS) {
    return `O período não pode passar de ${MAX_RANGE_DAYS} dias.`;
  }
  return null;
}
