import { HttpException } from "@/lib/http-exception";
import { DateTime } from "luxon";
import {
  customRangeError,
  DEFAULT_PRESET,
  FILTER_PARAMS,
  isPeriodPreset,
  PERIOD_PRESETS,
  ROLLING_PRESET_HOURS,
} from "./filters";

export const TIMEZONE = "America/Sao_Paulo";

export interface ResolvedRange {
  /** Inclusive. */
  start: DateTime;
  /** Exclusive. */
  end: DateTime;
}

/**
 * Turns the page filters into the [start, end) window sent to the main system,
 * always in America/Sao_Paulo: rolling presets end now; custom dates cover the
 * whole days from `inicio` 00:00 to the end of `fim` (both inclusive).
 */
export function resolveUsageRange(
  params: URLSearchParams,
  now: DateTime = DateTime.now(),
): ResolvedRange {
  const preset = params.get(FILTER_PARAMS.preset) ?? DEFAULT_PRESET;
  if (!isPeriodPreset(preset)) {
    throw new HttpException(
      400,
      `Período desconhecido: ${preset}. Válidos: ${PERIOD_PRESETS.join(", ")}.`,
    );
  }

  if (preset === "custom") {
    const start = params.get(FILTER_PARAMS.start) ?? "";
    const end = params.get(FILTER_PARAMS.end) ?? "";
    const error = customRangeError(start, end);
    if (error) throw new HttpException(400, error);

    return {
      start: DateTime.fromISO(start, { zone: TIMEZONE }).startOf("day"),
      end: DateTime.fromISO(end, { zone: TIMEZONE })
        .startOf("day")
        .plus({ days: 1 }),
    };
  }

  const end = now.setZone(TIMEZONE);
  return { start: end.minus({ hours: ROLLING_PRESET_HOURS[preset] }), end };
}
