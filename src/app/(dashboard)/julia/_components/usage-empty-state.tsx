import { formatDateTime } from "./usage-format";

export function UsageEmptyState({
  firstRecordedAt,
}: {
  firstRecordedAt: string | null;
}) {
  return (
    <section
      aria-label="Nenhuma chamada registrada no período"
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-bg-card px-8 py-14 text-center"
    >
      <span aria-hidden className="text-4xl">
        🤖
      </span>
      <h2 className="font-display text-lg font-bold text-text-primary">
        Nenhuma chamada de modelo registrada no período
      </h2>
      <p className="max-w-2xl text-sm text-text-secondary">
        O registro de consumo começa no deploy desta funcionalidade no sistema
        principal; chamadas anteriores existem só no dashboard do AI Gateway.{" "}
        {firstRecordedAt
          ? `O primeiro registro é de ${formatDateTime(firstRecordedAt)}: escolha um período a partir dessa data.`
          : "Ainda não há nenhum registro gravado."}
      </p>
    </section>
  );
}
