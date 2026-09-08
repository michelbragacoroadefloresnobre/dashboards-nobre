"use client";

import {
  isRollingPreset,
  serializeUsageFilters,
  type UsageFilters,
} from "@/app/api/julia/model-usage/filters";
import type { JuliaModelUsageReport } from "@/app/api/julia/model-usage/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Rolling presets refresh once a minute, like the sales dashboard.
export const JULIA_USAGE_REFRESH_MS = 60_000;

async function fetchJuliaUsage(
  filters: UsageFilters,
  signal: AbortSignal,
): Promise<JuliaModelUsageReport> {
  const res = await fetch(
    `/api/julia/model-usage?${serializeUsageFilters(filters)}`,
    { signal },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "Falha ao carregar o relatório da Julia.",
    );
  }
  const json = await res.json();
  return json.data as JuliaModelUsageReport;
}

export function useJuliaUsage(filters: UsageFilters, enabled: boolean) {
  const rolling = isRollingPreset(filters.preset);

  return useQuery({
    queryKey: ["julia-usage", serializeUsageFilters(filters).toString()],
    queryFn: ({ signal }) => fetchJuliaUsage(filters, signal),
    enabled,
    // Refetches keep the previous report on screen (at reduced opacity)
    // instead of flashing a skeleton.
    placeholderData: keepPreviousData,
    refetchInterval: rolling ? JULIA_USAGE_REFRESH_MS : false,
    retry: 1,
  });
}
