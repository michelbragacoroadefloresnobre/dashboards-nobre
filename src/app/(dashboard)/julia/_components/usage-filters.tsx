"use client";

import {
  normalizeAgents,
  PERIOD_PRESET_LABELS,
  PERIOD_PRESETS,
  type UsageFilters,
} from "@/app/api/julia/model-usage/filters";
import {
  JULIA_AGENT_DESCRIPTIONS,
  JULIA_AGENT_LABELS,
  JULIA_AGENT_SWATCH_CLASS,
  JULIA_AGENTS,
  type JuliaAgent,
} from "@/lib/julia-agents";

const LABEL_CLASS =
  "text-[11px] uppercase tracking-widest text-text-muted font-semibold";

const DATE_INPUT_CLASS =
  "rounded-lg border border-border bg-bg-card px-2.5 py-1.5 text-[12.5px] text-text-primary outline-none transition-colors focus:border-accent-green focus:ring-1 focus:ring-accent-green aria-invalid:border-accent-red";

export function AgentSwatch({
  agent,
  className = "",
}: {
  agent: JuliaAgent;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 shrink-0 rounded-full ${JULIA_AGENT_SWATCH_CLASS[agent]} ${className}`}
    />
  );
}

function chipClass(active: boolean): string {
  return `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer ${
    active
      ? "border-accent-green/30 bg-accent-green/[0.08] text-accent-green"
      : "border-border bg-bg-card text-text-muted hover:bg-bg-card-alt hover:text-text-primary"
  }`;
}

interface UsageFiltersBarProps {
  filters: UsageFilters;
  /** Today in America/Sao_Paulo ("YYYY-MM-DD"): the custom range cannot go past it. */
  maxDate: string;
  rangeError: string | null;
  onChange: (patch: Partial<UsageFilters>) => void;
}

export function UsageFiltersBar({
  filters,
  maxDate,
  rangeError,
  onChange,
}: UsageFiltersBarProps) {
  const allSelected = filters.agents.length === 0;
  const selected: JuliaAgent[] = allSelected
    ? [...JULIA_AGENTS]
    : filters.agents;

  function toggleAgent(agent: JuliaAgent) {
    const isSelected = selected.includes(agent);
    // At least one agent stays selected; use "Todos" to reset.
    if (isSelected && selected.length === 1) return;
    const next = isSelected
      ? selected.filter((item) => item !== agent)
      : [...selected, agent];
    onChange({ agents: normalizeAgents(next) });
  }

  return (
    <section
      aria-label="Filtros do relatório"
      className="flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      {/* Period */}
      <div className="flex items-center gap-2.5">
        <span className={LABEL_CLASS}>Período</span>
        <div
          role="radiogroup"
          aria-label="Período"
          className="inline-flex rounded-xl border border-border bg-bg-card p-1"
        >
          {PERIOD_PRESETS.map((preset) => {
            const active = filters.preset === preset;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ preset })}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-accent-green text-white shadow-sm"
                    : "text-text-secondary hover:bg-bg-card-alt hover:text-text-primary"
                }`}
              >
                {PERIOD_PRESET_LABELS[preset]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom range */}
      {filters.preset === "custom" && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[12.5px] text-text-secondary">
            De
            <input
              type="date"
              value={filters.customStart}
              max={maxDate}
              aria-invalid={rangeError !== null}
              onChange={(event) =>
                onChange({ customStart: event.target.value })
              }
              className={DATE_INPUT_CLASS}
            />
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px] text-text-secondary">
            Até
            <input
              type="date"
              value={filters.customEnd}
              min={filters.customStart}
              max={maxDate}
              aria-invalid={rangeError !== null}
              onChange={(event) => onChange({ customEnd: event.target.value })}
              className={DATE_INPUT_CLASS}
            />
          </label>
        </div>
      )}

      {/* Agents */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={LABEL_CLASS}>Agentes</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-pressed={allSelected}
            onClick={() => onChange({ agents: [] })}
            className={chipClass(allSelected)}
          >
            Todos
          </button>
          {JULIA_AGENTS.map((agent) => {
            const active = selected.includes(agent);
            return (
              <button
                key={agent}
                type="button"
                aria-pressed={active}
                aria-label={JULIA_AGENT_LABELS[agent]}
                title={JULIA_AGENT_DESCRIPTIONS[agent]}
                onClick={() => toggleAgent(agent)}
                className={chipClass(active)}
              >
                <AgentSwatch
                  agent={agent}
                  className={active ? "" : "opacity-40"}
                />
                {JULIA_AGENT_LABELS[agent]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
