import { Conquests } from "@/app/(dashboard)/vendas/_components/conquests";
import { DailyRanking } from "@/app/(dashboard)/vendas/_components/daily-ranking";
import { HeaderBanner } from "@/app/(dashboard)/vendas/_components/header-banner";
import { MonthlyRanking } from "@/app/(dashboard)/vendas/_components/monthly-ranking";
import { OperationKPIs } from "@/app/(dashboard)/vendas/_components/operation-kpis";
import { SalesRace } from "@/app/(dashboard)/vendas/_components/sales-race";
import { WeeklyRevenueChart } from "@/app/(dashboard)/vendas/_components/weekly-revenue-chart";

export function SalesDashboard() {
  return (
    <div className="grid grid-cols-[0.90fr_1.2fr_0.90fr] grid-rows-[auto_1fr] gap-5 p-6 h-full max-w-480 mx-auto">
      {/* Header with records — always visible */}
      <HeaderBanner />

      {/* Col Left */}
      <div className="flex flex-col gap-5 min-h-0 animate-fade-up-1">
        <MonthlyRanking />
      </div>

      {/* Col Center */}
      <div className="flex flex-col gap-5 min-h-0 animate-fade-up-2">
        <OperationKPIs />
        <SalesRace />
        <WeeklyRevenueChart />
      </div>

      {/* Col Right */}
      <div className="flex flex-col gap-5 min-h-0 animate-fade-up-3">
        <DailyRanking />
        <Conquests />
      </div>
    </div>
  );
}
