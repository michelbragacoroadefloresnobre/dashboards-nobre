import type {
  UsageByModel,
  UsageErrorRow,
} from "@/app/api/julia/model-usage/types";
import {
  JULIA_AGENT_LABELS,
  juliaTaskLabel,
  modelCallErrorLabel,
  type JuliaAgent,
} from "@/lib/julia-agents";
import type { ReactNode } from "react";
import { AgentSwatch } from "./usage-filters";
import {
  cacheRate,
  errorRate,
  formatCompact,
  formatCount,
  formatDateTime,
  formatDuration,
  formatPercent,
  formatUsd,
} from "./usage-format";

const TH =
  "whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted";
const TH_NUM = `${TH} text-right`;
const TD = "whitespace-nowrap px-4 py-2.5 align-top text-xs text-text-primary";
const TD_NUM = `${TD} text-right tabular-nums`;
const SUB = "block text-[11px] text-text-muted";

function TableCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-2xl border border-border bg-bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary">
          {title}
        </h2>
        <span className="text-[11px] text-text-muted">{summary}</span>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-xs text-text-muted"
      >
        {children}
      </td>
    </tr>
  );
}

function AgentCell({ agent }: { agent: JuliaAgent }) {
  return (
    <td className={TD}>
      <span className="flex items-center gap-2">
        <AgentSwatch agent={agent} />
        {JULIA_AGENT_LABELS[agent]}
      </span>
    </td>
  );
}

export function UsageByModelTable({ rows }: { rows: UsageByModel[] }) {
  return (
    <TableCard
      title="Por agente, tarefa e modelo"
      summary={`${formatCount(rows.length)} ${rows.length === 1 ? "combinação" : "combinações"}`}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg-card-alt">
            <th className={TH}>Agente</th>
            <th className={TH}>Tarefa</th>
            <th className={TH}>Modelo</th>
            <th className={TH_NUM}>Requisições</th>
            <th className={TH_NUM}>Execuções</th>
            <th className={TH_NUM}>Erros</th>
            <th className={TH_NUM}>Entrada</th>
            <th className={TH_NUM}>Cache lido</th>
            <th className={TH_NUM}>Cache gravado</th>
            <th className={TH_NUM}>Saída</th>
            <th className={TH_NUM}>Raciocínio</th>
            <th className={TH_NUM}>Cobrado</th>
            <th className={TH_NUM}>Mercado</th>
            <th className={TH_NUM}>p50</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {rows.length === 0 && (
            <EmptyRow colSpan={14}>
              Nenhuma chamada de modelo registrada no período.
            </EmptyRow>
          )}
          {rows.map((row) => (
            <tr
              key={`${row.agent}|${row.task ?? ""}|${row.model}`}
              className="hover:bg-bg-card-alt/50"
            >
              <AgentCell agent={row.agent} />
              <td className={TD}>{juliaTaskLabel(row.task)}</td>
              <td className={TD}>
                {row.model}
                {row.providers && (
                  <span className={SUB}>via {row.providers}</span>
                )}
              </td>
              <td className={TD_NUM}>{formatCount(row.requests)}</td>
              <td className={TD_NUM}>
                {formatCount(row.executions)}
                {row.failedExecutions > 0 && (
                  <span className="block text-[11px] text-accent-red">
                    {formatCount(row.failedExecutions)} falharam
                  </span>
                )}
              </td>
              <td className={TD_NUM}>
                {formatCount(row.errors)}
                <span className={SUB}>{formatPercent(errorRate(row))}</span>
              </td>
              <td className={TD_NUM}>{formatCompact(row.inputTokens)}</td>
              <td className={TD_NUM}>
                {formatCompact(row.cachedInputTokens)}
                <span className={SUB}>{formatPercent(cacheRate(row))}</span>
              </td>
              <td className={TD_NUM}>{formatCompact(row.cacheWriteTokens)}</td>
              <td className={TD_NUM}>{formatCompact(row.outputTokens)}</td>
              <td className={TD_NUM}>{formatCompact(row.reasoningTokens)}</td>
              <td className={TD_NUM}>{formatUsd(row.costUsd)}</td>
              <td className={TD_NUM}>{formatUsd(row.marketCostUsd)}</td>
              <td className={TD_NUM}>{formatDuration(row.p50DurationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

export function UsageErrorsTable({ rows }: { rows: UsageErrorRow[] }) {
  const occurrences = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <TableCard
      title="Erros por tipo"
      summary={`${formatCount(occurrences)} ${occurrences === 1 ? "ocorrência" : "ocorrências"}`}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg-card-alt">
            <th className={TH}>Agente</th>
            <th className={TH}>Tipo</th>
            <th className={TH_NUM}>Status HTTP</th>
            <th className={TH_NUM}>Ocorrências</th>
            <th className={TH}>Última vez</th>
            <th className={TH}>Última mensagem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {rows.length === 0 && (
            <EmptyRow colSpan={6}>Nenhum erro no período.</EmptyRow>
          )}
          {rows.map((row) => (
            <tr
              key={`${row.agent}|${row.errorKind}|${row.errorStatusCode ?? ""}`}
              className="hover:bg-bg-card-alt/50"
            >
              <AgentCell agent={row.agent} />
              <td className={TD}>{modelCallErrorLabel(row.errorKind)}</td>
              <td className={TD_NUM}>{row.errorStatusCode ?? "—"}</td>
              <td className={TD_NUM}>{formatCount(row.count)}</td>
              <td className={TD}>{formatDateTime(row.lastAt)}</td>
              <td
                className="max-w-[520px] truncate px-4 py-2.5 align-top text-xs text-text-secondary"
                title={row.lastMessage ?? undefined}
              >
                {row.lastMessage ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
