import { HttpException } from "@/lib/http-exception";
import { DateTime } from "luxon";
import {
  type CustomRange,
  customRangeBounds,
  customRangeError,
  DEFAULT_TIME,
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
 * always in America/Sao_Paulo: rolling presets end now; custom ranges run from
 * `inicio` at `horaInicio` to `fim` at `horaFim`, exclusive. Missing times
 * default to 00:00, so a whole day is 00:00 to 00:00 of the next day.
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
    const range: CustomRange = {
      customStart: params.get(FILTER_PARAMS.start) ?? "",
      customEnd: params.get(FILTER_PARAMS.end) ?? "",
      customStartTime: params.get(FILTER_PARAMS.startTime) ?? DEFAULT_TIME,
      customEndTime: params.get(FILTER_PARAMS.endTime) ?? DEFAULT_TIME,
    };
    const error = customRangeError(range);
    if (error) throw new HttpException(400, error);

    const bounds = customRangeBounds(range);
    return {
      start: DateTime.fromISO(bounds.start, { zone: TIMEZONE }),
      end: DateTime.fromISO(bounds.end, { zone: TIMEZONE }),
    };
  }

  const end = now.setZone(TIMEZONE);
  return { start: end.minus({ hours: ROLLING_PRESET_HOURS[preset] }), end };
}
