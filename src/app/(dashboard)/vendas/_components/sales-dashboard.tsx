"use client";

import { useDashboardData } from "@/app/(dashboard)/vendas/_hooks/use-dashboard-data";
import { TopSales } from "./top-sales";
import { DailyRanking } from "./daily-ranking";
import { HeaderBanner } from "./header-banner";
import { MonthlyRanking } from "./monthly-ranking";
import { OperationKPIs } from "./operation-kpis";
import { SalesProgress } from "./sales-progress";
import { WeeklyRevenueChart } from "./weekly-revenue-chart";

export function SalesDashboard() {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted text-sm animate-pulse">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-accent-red text-sm">
          Erro ao carregar dados. Tentando novamente...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[0.90fr_1.2fr_0.90fr] grid-rows-[auto_1fr] gap-5 p-6 h-full max-w-480 mx-auto">
      <HeaderBanner data={data.headerBanner} />

      {/* Col Left */}
      <div className="flex flex-col gap-5 min-h-0 animate-fade-up-1">
        <MonthlyRanking
          data={data.monthlyRanking}
          referenceMonth={data.referenceMonth}
        />
      </div>

      {/* Col Center */}
      <div className="flex flex-col gap-5 min-h-0 animate-fade-up-2">
        <OperationKPIs data={data.operationKpis} />
        <SalesProgress data={data.salesProgress} />
        <WeeklyRevenueChart data={data.weeklyRevenueChart} />
      </div>

      {/* Col Right */}
      <div className="flex flex-col gap-5 min-h-0 animate-fade-up-3">
        <DailyRanking data={data.dailyRanking} />
        <TopSales data={data.conquests} />
      </div>
    </div>
  );
}
