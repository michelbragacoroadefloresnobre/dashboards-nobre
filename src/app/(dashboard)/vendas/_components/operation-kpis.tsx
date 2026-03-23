import type { OperationResponse } from "@/app/api/operation/types";

interface OperationKPIsProps {
  data: OperationResponse["operationKpis"];
}

export function OperationKPIs({ data }: OperationKPIsProps) {
  const conversionFormatted = (data.conversionTax * 100).toFixed(2) + "%";
  const repasseFormatted = (data.repasse * 100).toFixed(2) + "%";

  return (
    <div className="bg-bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary flex items-center gap-2">
          <span className="text-[15px]">⚡</span> Operação
        </div>
      </div>
      <div className="px-5 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          <KpiCard
            label="Faturamento"
            value={data.revenue}
            change={data.revenueChange}
            formatChange={formatPercent}
          />
          <KpiCard
            label="Taxa de Conversão"
            value={conversionFormatted}
            change={data.conversionTaxChange}
            formatChange={formatPP}
          />
          <KpiCard
            label="Repasse"
            value={repasseFormatted}
            change={data.repasseChange}
            formatChange={formatPP}
            invertColor
          />
        </div>
      </div>
    </div>
  );
}

function formatPercent(value: number): string {
  const pct = (value * 100).toFixed(1);
  return `${value >= 0 ? "+" : ""}${pct}%`;
}

function formatPP(value: number): string {
  const pp = (value * 100).toFixed(1);
  return `${value >= 0 ? "+" : ""}${pp} %`;
}

function KpiCard({
  label,
  value,
  change,
  formatChange,
  invertColor,
}: {
  label: string;
  value: string;
  change: number | null;
  formatChange: (v: number) => string;
  invertColor?: boolean;
}) {
  const up = change !== null ? (invertColor ? change <= 0 : change >= 0) : true;
  const changeText = change !== null ? formatChange(change) : null;

  return (
    <div className="bg-bg-card-alt rounded-[10px] p-3.5 border border-border-light">
      <div className="text-[11px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">
        {label}
      </div>
      <div className="font-display text-3xl font-bold text-text-primary tracking-tight leading-none">
        {value}
      </div>
      {changeText !== null && (
        <div
          className={`inline-flex items-center gap-[3px] text-xs font-semibold mt-1.5 px-2 py-[2px] rounded-full ${
            up
              ? "text-accent-green bg-accent-green-light"
              : "text-accent-red bg-accent-red-light"
          }`}
        >
          {up ? "↑" : "↓"} {changeText}
        </div>
      )}
    </div>
  );
}
