import { teamsData, todayProfitData } from "@/data/dashboard";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function SalesRace() {
  const now = new Date();
  const currentDay = now.getDate();
  const totalDays = getDaysInMonth(now);
  const monthProgress = currentDay / totalDays;

  const sorted = [...teamsData].sort((a, b) => b.profit - a.profit);
  const leader = sorted[0];
  const difference = sorted[0].profit - sorted[1].profit;

  const entries = sorted.map((team) => {
    const ratio = team.profit / leader.profit;
    const width = ratio * monthProgress * 100;
    return { ...team, width: `${Math.max(width, 8)}%` };
  });

  return (
    <section
      aria-label="Corrida de vendas entre equipes"
      className="bg-linear-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] rounded-2xl p-5 text-white relative overflow-hidden"
    >
      <div className="absolute -top-1/2 -right-[20%] w-[250px] h-[250px] bg-[radial-gradient(circle,rgba(200,150,62,0.12)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span aria-hidden="true" className="animate-shimmer text-base">
          🏆
        </span>
        <span className="text-xs uppercase tracking-[1.5px] opacity-70 font-semibold">
          Corrida de Vendas
        </span>
        <span className="text-[11px] opacity-40 ml-auto">
          Lucro médio do mês
        </span>
      </div>

      {/* Race bars */}
      <div
        className="flex flex-col gap-3"
        role="list"
        aria-label="Ranking de lucro por equipe"
      >
        {entries.map((team, i) => (
          <RaceEntry
            key={team.name}
            position={`${i + 1}º`}
            name={`${team.emoji} ${team.name}`}
            value={formatCurrency(team.profit)}
            width={team.width}
            gold={i === 0}
          />
        ))}
      </div>

      {/* Footer: difference + today's profit */}
      <div className="flex items-center justify-between mt-4 bg-white/6 border border-white/8 rounded-xl px-4 py-3">
        <span className="text-sm font-medium opacity-60">
          ↕ {formatCurrency(difference)} de diferença
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-xs uppercase tracking-widest opacity-40 font-semibold">
            Hoje
          </span>
          <span
            className="text-base font-bold text-accent-gold"
            aria-label={`Lucro parcial de hoje: ${formatCurrency(todayProfitData.profit)}`}
          >
            {formatCurrency(todayProfitData.profit)}
          </span>
        </div>
      </div>
    </section>
  );
}

function RaceEntry({
  position,
  name,
  value,
  width,
  gold,
}: {
  position: string;
  name: string;
  value: string;
  width: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-center gap-3" role="listitem">
      <div
        className={`text-sm font-bold min-w-6 text-center ${
          gold ? "text-accent-gold opacity-100" : "opacity-60"
        }`}
        aria-hidden="true"
      >
        {position}
      </div>
      <div className="flex-1 h-11 bg-white/[0.08] rounded-lg overflow-visible relative">
        <div
          className={`h-full rounded-lg flex items-center px-3.5 gap-2.5 animate-bar-grow ${
            gold
              ? "bg-gradient-to-r from-[rgba(200,150,62,0.35)] to-[rgba(200,150,62,0.15)] border-2 border-[rgba(200,150,62,0.35)]"
              : "bg-gradient-to-r from-white/15 to-white/5 border border-white/15"
          }`}
          style={{ width }}
          role="meter"
          aria-label={`${name}: ${value}`}
          aria-valuenow={parseFloat(width)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="text-sm font-semibold whitespace-nowrap">
            {name}
          </span>
          <span className="text-sm font-bold whitespace-nowrap ml-auto">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}
