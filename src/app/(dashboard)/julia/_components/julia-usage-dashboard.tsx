"use client";

import {
  customRangeError,
  isRollingPreset,
  readUsageFilters,
  serializeUsageFilters,
  type UsageFilters,
} from "@/app/api/julia/model-usage/filters";
import { JULIA_AGENTS, type JuliaAgent } from "@/lib/julia-agents";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { JULIA_USAGE_REFRESH_MS, useJuliaUsage } from "../_hooks/use-julia-usage";
import { UsageFiltersBar } from "./usage-filters";
import {
  type CostMetric,
  defaultCostMetric,
  formatClock,
  formatDateTime,
  shiftDateOnly,
  todayInSaoPaulo,
  type TokenMetric,
} from "./usage-format";
import { Notice } from "./usage-notice";
import { UsageReport } from "./usage-report";

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

const TILE_SKELETONS = ["cost", "requests", "errors", "tokens", "cache", "p50"];
const CHART_SKELETONS = ["cost", "requests", "error-rate", "tokens"];

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="grid grid-cols-3 gap-4 2xl:grid-cols-6">
        {TILE_SKELETONS.map((key) => (
          <div
            key={key}
            className="h-[92px] animate-pulse rounded-2xl border border-border bg-bg-card"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
        {CHART_SKELETONS.map((key) => (
          <div
            key={key}
            className="h-[360px] animate-pulse rounded-2xl border border-border bg-bg-card"
          />
        ))}
      </div>
    </div>
  );
}

export function JuliaUsageDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Calendar "today" in São Paulo, fixed for the life of the page.
  const [today] = useState(() => todayInSaoPaulo());
  const fallbackRange = useMemo(
    () => ({ start: shiftDateOnly(today, -6), end: today }),
    [today],
  );

  // The URL is the single source of truth for the filters.
  const filters = useMemo(
    () =>
      readUsageFilters(
        new URLSearchParams(searchParams.toString()),
        fallbackRange,
      ),
    [searchParams, fallbackRange],
  );

  const updateFilters = useCallback(
    (patch: Partial<UsageFilters>) => {
      const query = serializeUsageFilters({ ...filters, ...patch }).toString();
      router.replace(`${pathname}?${query}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  const rangeError =
    filters.preset === "custom"
      ? customRangeError(filters.customStart, filters.customEnd)
      : null;

  const query = useJuliaUsage(filters, rangeError === null);
  const report = query.data;

  // Chart metric choices are view state; `null` follows the data-driven default.
  const [costChoice, setCostChoice] = useState<CostMetric | null>(null);
  const [tokenMetric, setTokenMetric] = useState<TokenMetric>("total");
  const costMetric: CostMetric =
    costChoice ?? (report ? defaultCostMetric(report.totals) : "costUsd");

  const agents = useMemo<JuliaAgent[]>(
    () => (filters.agents.length ? filters.agents : [...JULIA_AGENTS]),
    [filters.agents],
  );

  const rolling = isRollingPreset(filters.preset);
  const showSkeleton = !report && rangeError === null && !query.isError;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 p-6">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 animate-slide-down">
          <div>
            <h1 className="font-display text-[22px] font-bold tracking-tight text-text-primary">
              Relatório da Julia
            </h1>
            <p className="mt-0.5 text-[13px] text-text-secondary">
              Consumo de modelo de IA da Julia e dos sub-agentes: custo,
              requisições, erros, tokens e cache de prompt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-muted">
            {report && (
              <span>
                {formatDateTime(report.range.start)} até{" "}
                {formatDateTime(report.range.end)} · por{" "}
                {report.range.bucket === "hour" ? "hora" : "dia"}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              {rolling ? (
                <>
                  <span
                    aria-hidden
                    className="inline-block size-1.75 rounded-full bg-[#4ADE80] animate-pulse-dot"
                  />
                  Atualiza a cada {JULIA_USAGE_REFRESH_MS / 1000} s
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    className="inline-block size-1.75 rounded-full bg-amber-400"
                  />
                  Período fixo
                </>
              )}
              {query.dataUpdatedAt > 0 && (
                <> · às {formatClock(query.dataUpdatedAt)}</>
              )}
            </span>
            <button
              type="button"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-bg-card-alt hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon spinning={query.isFetching} />
              Atualizar
            </button>
          </div>
        </header>

        <UsageFiltersBar
          filters={filters}
          maxDate={today}
          rangeError={rangeError}
          onChange={updateFilters}
        />

        {rangeError && (
          <Notice tone="error" title="Período inválido">
            {rangeError}
          </Notice>
        )}

        {query.isError && (
          <Notice tone="error" title="Erro ao carregar o relatório">
            {query.error.message}
            <button
              type="button"
              onClick={() => query.refetch()}
              className="cursor-pointer font-semibold underline underline-offset-2"
            >
              Tentar novamente
            </button>
          </Notice>
        )}

        {showSkeleton && <DashboardSkeleton />}

        {report && (
          // Refetches keep the previous report at reduced opacity: no skeleton,
          // no layout jump.
          <div
            aria-busy={query.isFetching}
            className={`transition-opacity duration-200 ${
              query.isFetching ? "opacity-60" : ""
            }`}
          >
            <div className="flex flex-col gap-5 animate-fade-up">
              <UsageReport
                report={report}
                agents={agents}
                costMetric={costMetric}
                onCostMetricChange={setCostChoice}
                tokenMetric={tokenMetric}
                onTokenMetricChange={setTokenMetric}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
