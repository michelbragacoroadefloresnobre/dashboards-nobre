"use client";

import { useDashboardData } from "@/app/(dashboard)/vendas/_hooks/use-dashboard-data";
import { useQueryClient } from "@tanstack/react-query";
import { useTopSaleEvent } from "../_hooks/use-top-sale-event";
import { DailyRanking } from "./daily-ranking";
import { HeaderBanner } from "./header-banner";
import { MonthlyRanking } from "./monthly-ranking";
import { OperationKPIs } from "./operation-kpis";
import { SalesProgress } from "./sales-progress";
import { TopSaleCelebration } from "./top-sale-celebration";
import { TopSales } from "./top-sales";
import { WeeklyRevenueChart } from "./weekly-revenue-chart";

export function SalesDashboard() {
  const { data, isLoading, isError } = useDashboardData();
  const queryClient = useQueryClient();
  const { currentEvent, dismiss } = useTopSaleEvent();

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["operation"] })
          }
          className="fixed bottom-6 right-20 z-50 bg-accent-red text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg opacity-60 hover:opacity-100 transition-opacity"
        >
          Invalidar cache
        </button>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-text-muted text-sm animate-pulse">
            Carregando dashboard...
          </div>
        </div>
      ) : isError || !data ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-accent-red text-sm">
            Erro ao carregar dados. Tentando novamente...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[0.90fr_1.2fr_0.90fr] grid-rows-[auto_1fr] gap-5 p-6 h-full max-w-512 mx-auto">
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
      )}

      {currentEvent && (
        <TopSaleCelebration event={currentEvent} onDismiss={dismiss} />
      )}
    </>
  );
}
