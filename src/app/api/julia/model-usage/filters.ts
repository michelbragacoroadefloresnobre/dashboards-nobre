import { isJuliaAgent, JULIA_AGENTS, type JuliaAgent } from "@/lib/julia-agents";

// ---------------------------------------------------------------------------
// Filters of the "Relatório da Julia" page. They are the contract between the
// URL (?periodo=7d&inicio=…&horaInicio=…&fim=…&horaFim=…&agentes=…), the page
// and the internal route GET /api/julia/model-usage, which turns them into the
// start/end window the main system expects. Everything here runs on both sides
// and knows nothing about timezones; the America/Sao_Paulo resolution lives in
// `range.ts`.
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

/** Time of day used when the URL has none: whole days run from midnight to midnight. */
export const DEFAULT_TIME = "00:00";

export const FILTER_PARAMS = {
  preset: "periodo",
  start: "inicio",
  startTime: "horaInicio",
  end: "fim",
  endTime: "horaFim",
  agents: "agentes",
} as const;

export interface UsageFilters {
  preset: PeriodPreset;
  /**
   * Custom range, only used with preset "custom": the [start, end) window in
   * America/Sao_Paulo, each side a date ("YYYY-MM-DD") plus a time ("HH:mm").
   * The end is exclusive, so a whole day runs from 00:00 to 00:00 of the next
   * day.
   */
  customStart: string;
  customStartTime: string;
  customEnd: string;
  customEndTime: string;
  /** Empty = all agents. */
  agents: JuliaAgent[];
}

/** The part of the filters that describes the custom range. */
export type CustomRange = Pick<
  UsageFilters,
  "customStart" | "customStartTime" | "customEnd" | "customEndTime"
>;

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

/** `HH:mm` on the 24-hour clock, as produced by `<input type="time">`. */
export function isTimeOfDay(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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
  const startTime = params.get(FILTER_PARAMS.startTime) ?? "";
  const end = params.get(FILTER_PARAMS.end) ?? "";
  const endTime = params.get(FILTER_PARAMS.endTime) ?? "";
  return {
    preset: isPeriodPreset(preset) ? preset : DEFAULT_PRESET,
    customStart: isDateOnly(start) ? start : fallbackRange.start,
    customStartTime: isTimeOfDay(startTime) ? startTime : DEFAULT_TIME,
    customEnd: isDateOnly(end) ? end : fallbackRange.end,
    customEndTime: isTimeOfDay(endTime) ? endTime : DEFAULT_TIME,
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
    params.set(FILTER_PARAMS.startTime, filters.customStartTime);
    params.set(FILTER_PARAMS.end, filters.customEnd);
    params.set(FILTER_PARAMS.endTime, filters.customEndTime);
  }
  const agents = normalizeAgents(filters.agents);
  if (agents.length) params.set(FILTER_PARAMS.agents, agents.join(","));
  return params;
}

export interface CustomRangeBounds {
  /** Inclusive wall-clock start, "YYYY-MM-DDTHH:mm" without offset. */
  start: string;
  /** Exclusive wall-clock end, "YYYY-MM-DDTHH:mm" without offset. */
  end: string;
}

/**
 * The [start, end) window of a custom range on the wall clock, before any
 * timezone is applied. Assumes the range passed `customRangeError`.
 */
export function customRangeBounds(range: CustomRange): CustomRangeBounds {
  return {
    start: `${range.customStart}T${range.customStartTime}`,
    end: `${range.customEnd}T${range.customEndTime}`,
  };
}

/** Validation shared by the page and the route; `null` when the range is usable. */
export function customRangeError(range: CustomRange): string | null {
  if (!isDateOnly(range.customStart) || !isDateOnly(range.customEnd)) {
    return "Informe uma data inicial e uma data final válidas.";
  }
  if (!isTimeOfDay(range.customStartTime) || !isTimeOfDay(range.customEndTime)) {
    return "Informe um horário inicial e um horário final válidos (HH:mm).";
  }
  if (range.customStart > range.customEnd) {
    return "A data inicial precisa ser igual ou anterior à data final.";
  }
  const { start, end } = customRangeBounds(range);
  // Same calendar format on both sides, so string order is chronological.
  if (start >= end) {
    return "O horário inicial precisa ser anterior ao horário final.";
  }
  const durationMs = Date.parse(`${end}:00Z`) - Date.parse(`${start}:00Z`);
  if (durationMs > MAX_RANGE_DAYS * 86_400_000) {
    return `O período não pode passar de ${MAX_RANGE_DAYS} dias.`;
  }
  return null;
}
