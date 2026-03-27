import { withAuth, withErrorHandler } from "@/lib/api-handler";
import { DateTime } from "luxon";
import {
  buildDailyRanking,
  buildMonthlyRanking,
  filterNonCancelled,
  formatCurrency,
  formatDateBR,
  formatDateShort,
} from "./helpers";
import type {
  ExternalDailySummary,
  ExternalForm,
  ExternalOrderSummary,
  ExternalTeamOfToday,
  OperationResponse,
} from "./types";

const TIMEZONE = "America/Sao_Paulo";
const API_BASE = "/api/v1/dashboard/operation";

async function fetchApi<T>(path: string): Promise<T> {
  const base = process.env.SISTEMA_CFN_URL;
  if (!base) throw new Error("SISTEMA_CFN_URL is not configured");

  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);

  const json = await res.json();
  return json.data as T;
}

export const GET = withErrorHandler(
  withAuth(async (_request, _context, _session) => {
    const now = DateTime.now().setZone(TIMEZONE);
    const midnightToday = now.startOf("day");
    const midnightYesterday = midnightToday.minus({ days: 1 });
    const startOfMonth = now.startOf("month");
    const sevenDaysAgo = now.minus({ days: 7 }).startOf("day");

    // -- Parallel fetch -------------------------------------------------------
    const [
      monthOrders,
      todayOrders,
      allDailySummaries,
      recentDailySummaries,
      teamOfTodayRes,
      topSales,
    ] = await Promise.all([
      fetchApi<ExternalOrderSummary[]>(
        `${API_BASE}/order-summaries?start=${startOfMonth.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalOrderSummary[]>(
        `${API_BASE}/order-summaries?start=${midnightToday.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalDailySummary[]>(`${API_BASE}/daily-team-summaries`),
      fetchApi<ExternalDailySummary[]>(
        `${API_BASE}/daily-team-summaries?start=${sevenDaysAgo.toFormat("yyyy-MM-dd")}&end=${now.toFormat("yyyy-MM-dd")}`,
      ),
      fetchApi<ExternalTeamOfToday>(`${API_BASE}/team-of-today`),
      fetchApi<ExternalOrderSummary[]>(`${API_BASE}/top-sales`),
    ]);

    const teamOfToday = teamOfTodayRes.team;

    // Fetch forms for conversion rate calculation
    const [monthForms, todayForms, yesterdayForms] = await Promise.all([
      fetchApi<ExternalForm[]>(
        `${API_BASE}/forms?start=${startOfMonth.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalForm[]>(
        `${API_BASE}/forms?start=${midnightToday.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalForm[]>(
        `${API_BASE}/forms?start=${midnightYesterday.toISO()}&end=${midnightToday.toISO()}`,
      ),
    ]);

    // Compute global conversion tax for KPIs
    function computeConversionTax(
      forms: ExternalForm[],
      team?: string,
    ): number {
      const filtered = team ? forms.filter((f) => f.team === team) : forms;
      if (filtered.length === 0) return 0;
      const converted = filtered.filter((f) => f.status === "CONVERTED").length;
      return converted / filtered.length;
    }

    const conversionTax = computeConversionTax(todayForms, teamOfToday);
    const yesterdayConversionTax = computeConversionTax(yesterdayForms);

    // -- Processing -----------------------------------------------------------

    // 1. Header Banner
    const headerBanner = buildHeaderBanner(allDailySummaries, now, teamOfToday);

    // 2. Monthly Ranking
    const monthlyRanking = buildMonthlyRanking(
      filterNonCancelled(monthOrders),
      monthForms,
      now,
    );

    // 3. Daily Ranking (filtered by team-of-today)
    const dailyRanking = buildDailyRanking(
      filterNonCancelled(todayOrders),
      todayForms,
      teamOfToday,
    );

    // 4. Operation KPIs (with yesterday comparison)
    const operationKpis = buildOperationKpis(
      allDailySummaries,
      now,
      teamOfToday,
      conversionTax,
      yesterdayConversionTax,
    );

    // 5. Sales Race (daily summaries from the 1st of the current month)
    const monthStartStr = startOfMonth.toFormat("yyyy-MM-dd");
    const monthDailySummaries = allDailySummaries.filter(
      (ds) => ds.date >= monthStartStr,
    );
    const salesProgress = buildSalesProgress(
      filterNonCancelled(monthOrders),
      monthDailySummaries,
      now,
      teamOfToday,
    );

    const weeklyRevenueChart = buildWeeklyRevenueChart(recentDailySummaries);

    const conquests = topSales.map((o) => ({
      name: (o.product?.name ?? "Produto")
        .replace(/^Coroa de Flores/i, "")
        .trim(),
      price: formatCurrency(parseFloat(o.amount), true),
      imageUrl: o.product?.imageUrl,
      sellerName: o.seller?.name,
      sellerImageUrl: o.seller?.imageUrl ?? null,
    }));

    const referenceMonth = now
      .setLocale("pt-BR")
      .toFormat("LLLL yyyy")
      .replace(/^./, (c) => c.toUpperCase());

    const payload: OperationResponse = {
      referenceMonth,
      headerBanner,
      monthlyRanking,
      dailyRanking,
      operationKpis,
      salesProgress,
      weeklyRevenueChart,
      conquests,
    };

    return Response.json(
      { data: payload },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }),
);

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildHeaderBanner(
  dailySummaries: ExternalDailySummary[],
  now: DateTime,
  teamOfToday: string,
): OperationResponse["headerBanner"] {
  let highestRevenue = { value: "R$ 0,00", date: "--", team: "--" };
  let highestOrders = { value: 0, date: "--", team: "--" };

  let maxInvoice = 0;
  let maxOrders = 0;

  for (const ds of dailySummaries) {
    const invoice = Number(ds.invoice);
    if (invoice > maxInvoice) {
      maxInvoice = invoice;
      highestRevenue = {
        value: formatCurrency(invoice),
        date: formatDateBR(ds.date),
        team: ds.team,
      };
    }
    if (ds.orderTotal > maxOrders) {
      maxOrders = ds.orderTotal;
      highestOrders = {
        value: ds.orderTotal,
        date: formatDateBR(ds.date),
        team: ds.team,
      };
    }
  }

  return {
    highestRevenue,
    highestOrders,
    today: {
      date: now.toFormat("dd/MM/yyyy"),
      team: teamOfToday,
    },
  };
}

function buildOperationKpis(
  dailySummaries: ExternalDailySummary[],
  now: DateTime,
  teamOfToday: string,
  conversionTax: number,
  yesterdayConversionTax: number,
): OperationResponse["operationKpis"] {
  const todayStr = now.toFormat("yyyy-MM-dd");
  const yesterdayStr = now.minus({ days: 1 }).toFormat("yyyy-MM-dd");

  const todaySummary = dailySummaries.find(
    (ds) => ds.date === todayStr && ds.team === teamOfToday,
  );
  const yesterdaySummary = dailySummaries.find(
    (ds) => ds.date === yesterdayStr,
  );

  const todayInvoice = todaySummary ? parseFloat(todaySummary.invoice) : 0;
  const yesterdayInvoice = yesterdaySummary
    ? parseFloat(yesterdaySummary.invoice)
    : 0;

  const repasse =
    todaySummary?.passthroughRate != null
      ? parseFloat(todaySummary.passthroughRate)
      : 0;
  const yesterdayRepasse =
    yesterdaySummary?.passthroughRate != null
      ? parseFloat(yesterdaySummary.passthroughRate)
      : 0;

  const revenueChange =
    yesterdayInvoice > 0 ? todayInvoice - yesterdayInvoice : null;
  const conversionTaxChange =
    yesterdayConversionTax > 0 ? conversionTax - yesterdayConversionTax : null;
  const repasseChange =
    yesterdayRepasse > 0 ? repasse - yesterdayRepasse : null;

  return {
    revenue: formatCurrency(todayInvoice),
    conversionTax,
    repasse,
    revenueChange,
    conversionTaxChange,
    repasseChange,
  };
}

function buildSalesProgress(
  monthOrders: ExternalOrderSummary[],
  monthDailySummaries: ExternalDailySummary[],
  now: DateTime,
  teamOfToday: string,
): OperationResponse["salesProgress"] {
  const todayStr = now.toFormat("yyyy-MM-dd");

  // 1. Profit per team from OrderSummaries (start of month to yesterday)
  const teamProfit = new Map<string, number>();

  for (const order of monthOrders) {
    const orderDate = DateTime.fromISO(order.createdAt)
      .setZone(TIMEZONE)
      .toFormat("yyyy-MM-dd");
    if (orderDate >= todayStr) continue;

    const team = order.team;
    if (team === "none") continue;
    if (order.cost == null) continue;

    const profit = parseFloat(order.amount) - parseFloat(order.cost);
    teamProfit.set(team, (teamProfit.get(team) ?? 0) + profit);
  }

  // 2. Days worked per team from DailyTeamSummaries (start of month to yesterday)
  const teamDays = new Map<string, number>();

  for (const ds of monthDailySummaries) {
    if (ds.date >= todayStr) continue;

    const team = ds.team;
    if (team === "none") continue;

    teamDays.set(team, (teamDays.get(team) ?? 0) + 1);
  }

  // 3. Today's profit from DailyTeamSummary
  let todayProfit = 0;
  const todaySummary = monthDailySummaries.find(
    (ds) => ds.date === todayStr && ds.team === teamOfToday,
  );
  if (todaySummary && todaySummary.cost != null) {
    todayProfit =
      parseFloat(todaySummary.invoice) - parseFloat(todaySummary.cost);
  }

  // 4. Build average profit per team
  const allTeams = new Set([...teamProfit.keys(), ...teamDays.keys()]);
  const teams = Array.from(allTeams).map((name) => {
    const profit = teamProfit.get(name) ?? 0;
    const days = teamDays.get(name) ?? 0;
    const averageProfit = days > 0 ? profit / days : 0;
    return { name, averageProfit };
  });

  teams.sort((a, b) => b.averageProfit - a.averageProfit);

  const profitDifference =
    teams.length >= 2 ? teams[0].averageProfit - teams[1].averageProfit : 0;

  return {
    teams,
    todayProfit: { team: teamOfToday, profit: todayProfit },
    profitDifference,
  };
}

function buildWeeklyRevenueChart(
  recentDailySummaries: ExternalDailySummary[],
): OperationResponse["weeklyRevenueChart"] {
  return recentDailySummaries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((ds) => ({
      date: formatDateShort(ds.date),
      team: ds.team,
      invoice: parseFloat(ds.invoice),
    }));
}
