export function OperationKPIs() {
  return (
    <div className="bg-bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary flex items-center gap-2">
          <span className="text-[15px]">⚡</span> Operação
        </div>
      </div>
      <div className="px-5 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          <KpiCard label="Faturamento" value="R$ 71.697" change="+12%" up />
          <KpiCard label="Taxa de Conversão" value="80,00%" change="+3.2%" up />
          <KpiCard label="Repasse" value="42,24%" change="-1.1%" up={false} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  up,
}: {
  label: string;
  value: string;
  change: string;
  up: boolean;
}) {
  return (
    <div className="bg-bg-card-alt rounded-[10px] p-3.5 border border-border-light">
      <div className="text-[11px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">
        {label}
      </div>
      <div className="font-display text-[32px] font-bold text-text-primary tracking-tight leading-none">
        {value}
      </div>
      <div
        className={`inline-flex items-center gap-[3px] text-xs font-semibold mt-1.5 px-2 py-[2px] rounded-full ${
          up
            ? "text-accent-green bg-accent-green-light"
            : "text-accent-red bg-accent-red-light"
        }`}
      >
        {up ? "↑" : "↓"} {change}
      </div>
    </div>
  );
}
