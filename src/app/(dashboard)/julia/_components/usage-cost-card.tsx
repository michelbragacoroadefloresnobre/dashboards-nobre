import type {
  CostAccounting,
  UsageCosts,
} from "@/app/api/julia/model-usage/types";
import {
  costCoverageIssues,
  formatCount,
  formatDateTime,
  formatTokenHours,
  formatUsd,
  plural,
} from "./usage-format";

// ---------------------------------------------------------------------------
// Breakdown of the estimated cost (contract "Custos da Julia", version 2).
// The inference figures come from `totals.costs`; the cache storage is a
// shared, unallocated cost of every Julia agent and lives in its own cell,
// never added to an agent, model or bucket. The grand total only appears when
// the contract allows the sum, and is never presented as the invoice.
// ---------------------------------------------------------------------------

interface CostCellProps {
  label: string;
  /** Tooltip explaining the measure. */
  title?: string;
  value: string;
  detail: string;
  tone?: "default" | "muted" | "warning";
  emphasis?: boolean;
}

function CostCell({
  label,
  title,
  value,
  detail,
  tone = "default",
  emphasis = false,
}: CostCellProps) {
  const detailClass =
    tone === "warning"
      ? "text-accent-gold"
      : tone === "muted"
        ? "text-text-muted"
        : "text-text-secondary";

  return (
    <div className="flex min-w-0 flex-col gap-1 px-5 py-4">
      <span
        className="text-[11px] font-semibold uppercase tracking-widest text-text-muted"
        title={title}
      >
        {label}
      </span>
      <span
        className={`truncate font-display font-bold leading-none tracking-tight ${
          emphasis
            ? "text-[26px] text-text-primary"
            : "text-[22px] text-text-primary"
        }`}
      >
        {value}
      </span>
      <span className={`truncate text-xs ${detailClass}`} title={detail}>
        {detail}
      </span>
    </div>
  );
}

interface CellContent {
  value: string;
  detail: string;
  tone?: CostCellProps["tone"];
}

function cacheStorageCell(accounting: CostAccounting | null): CellContent {
  if (!accounting) {
    return {
      value: "—",
      detail: "Indisponível no contrato atual da API",
      tone: "muted",
    };
  }
  const cache = accounting.sharedCacheStorage;
  if (cache.resources === 0) {
    return {
      value: "—",
      detail: cache.firstRecordedAt
        ? "Nenhum recurso de cache registrado no período"
        : "Histórico de recursos de cache ainda não iniciado",
      tone: "muted",
    };
  }
  const resources = `${formatCount(cache.resources)} ${plural(cache.resources, "recurso", "recursos")}`;
  if (cache.estimatedUsd === null) {
    return {
      value: formatUsd(cache.knownEstimatedUsd),
      detail: `Parcial: ${formatTokenHours(cache.unpricedTokenHours)} sem tarifa · ${resources}`,
      tone: "warning",
    };
  }
  return {
    value: formatUsd(cache.estimatedUsd),
    detail: `Todos os agentes · ${resources} · ${formatTokenHours(cache.tokenHours)}`,
  };
}

function grandTotalCell(
  costs: UsageCosts,
  accounting: CostAccounting | null,
  allAgentsSelected: boolean,
  rangeStart: string,
): CellContent {
  if (!allAgentsSelected) {
    return {
      value: "—",
      detail: "Disponível só com todos os agentes selecionados",
      tone: "muted",
    };
  }
  if (!accounting) {
    return {
      value: "—",
      detail: "Indisponível no contrato atual da API",
      tone: "muted",
    };
  }
  const cache = accounting.sharedCacheStorage;
  if (cache.estimatedUsd === null) {
    return {
      value: "—",
      detail:
        cache.resources === 0
          ? "Sem estimativa de armazenamento do cache"
          : "Armazenamento do cache sem tarifa em parte do período",
      tone: "muted",
    };
  }
  // The cache ledger has to cover the whole period; older caches are never
  // reconstructed, so a later start would understate the storage.
  if (
    cache.firstRecordedAt === null ||
    Date.parse(cache.firstRecordedAt) > Date.parse(rangeStart)
  ) {
    return {
      value: "—",
      detail: `Histórico do cache começa em ${formatDateTime(cache.firstRecordedAt)}`,
      tone: "muted",
    };
  }
  const incomplete = costs.missingEstimateRequests > 0;
  return {
    value: formatUsd(costs.estimatedInferenceUsd + cache.estimatedUsd),
    detail: incomplete
      ? `Incompleto: ${formatCount(costs.missingEstimateRequests)} ${plural(costs.missingEstimateRequests, "chamada", "chamadas")} sem custo · estimativa, não é a fatura`
      : "Inferência + cache · estimativa, não é a fatura",
    tone: incomplete ? "warning" : "default",
  };
}

export interface UsageCostCardProps {
  costs: UsageCosts;
  /** Calls in the period, to size the coverage. */
  requests: number;
  costAccounting: CostAccounting | null;
  allAgentsSelected: boolean;
  /** ISO start of the report range. */
  rangeStart: string;
}

export function UsageCostCard({
  costs,
  requests,
  costAccounting,
  allAgentsSelected,
  rangeStart,
}: UsageCostCardProps) {
  const cache = cacheStorageCell(costAccounting);
  const total = grandTotalCell(
    costs,
    costAccounting,
    allAgentsSelected,
    rangeStart,
  );
  const issues = costCoverageIssues(costs);
  const incomplete = costs.missingEstimateRequests > 0;

  return (
    <section
      aria-label="Custos estimados"
      className="rounded-2xl border border-border bg-bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary">
            Custos estimados
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            Débito no AI Gateway mais o custo do provedor a preço de tabela
            (BYOK). Não inclui ajustes, créditos ou impostos da fatura Google.
          </p>
        </div>
        <p
          className={`text-[12px] ${incomplete ? "text-accent-gold" : "text-text-muted"}`}
          title="Chamadas cuja consulta de cobrança no Gateway já foi concluída; não é conciliação com a fatura"
        >
          {formatCount(costs.resolvedRequests)} de {formatCount(requests)}{" "}
          {plural(requests, "chamada", "chamadas")} com cobrança consultada
          {issues && <> · {issues}</>}
        </p>
      </div>

      <div className="grid grid-cols-3 divide-y divide-border-light border-t border-border-light 2xl:grid-cols-5 2xl:divide-x 2xl:divide-y-0">
        <CostCell
          label="Inferência estimada"
          title="Por chamada consultada: débito no Gateway + provedor. Enquanto a consulta estiver pendente, usa o preço de referência inicial."
          value={formatUsd(costs.estimatedInferenceUsd)}
          detail={
            incomplete
              ? `Incompleto: ${formatCount(costs.missingEstimateRequests)} ${plural(costs.missingEstimateRequests, "chamada", "chamadas")} sem custo de referência`
              : "Gateway + provedor, por chamada"
          }
          tone={incomplete ? "warning" : "default"}
          emphasis
        />
        <CostCell
          label="Débito no Gateway"
          title="Soma dos débitos conhecidos no saldo do AI Gateway, adicionais inclusos"
          value={formatUsd(costs.gatewayUsd)}
          detail={`Adicionais do Gateway ${formatUsd(costs.gatewaySurchargeUsd)}`}
        />
        <CostCell
          label="Provedor (BYOK)"
          title="Inferência com a credencial própria, a preço de tabela do provedor. Zero nas chamadas com credencial da Vercel, já contidas no Gateway."
          value={formatUsd(costs.providerEstimatedUsd)}
          detail="Preço de tabela · sem armazenamento do cache"
        />
        <CostCell
          label="Armazenamento do cache"
          title="Custo compartilhado por todos os agentes da Julia, sem rateio, no mesmo período; não entra em nenhum agente, modelo ou ponto da série"
          value={cache.value}
          detail={cache.detail}
          tone={cache.tone}
        />
        <CostCell
          label="Total com cache"
          title="Inferência estimada + armazenamento do cache. Só quando todos os agentes estão selecionados, há tarifa e o histórico do cache cobre o período."
          value={total.value}
          detail={total.detail}
          tone={total.tone}
        />
      </div>
    </section>
  );
}
