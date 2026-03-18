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
  ExternalConversionTax,
  ExternalDailySummary,
  ExternalOrderSummary,
  ExternalTeamOfToday,
  OperationResponse,
} from "./types";

const TIMEZONE = "America/Sao_Paulo";
const API_BASE = "/api/v1/dashboard/operation";

async function fetchApi<T>(path: string): Promise<T> {
  const base = process.env.SYSTEM_API_URL;
  if (!base) throw new Error("SYSTEM_API_URL is not configured");

  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);

  const json = await res.json();
  return json.data as T;
}

export async function GET() {
  try {
    const now = DateTime.now().setZone(TIMEZONE);
    const midnightToday = now.startOf("day");
    const midnightYesterday = midnightToday.minus({ days: 1 });
    const startOfMonth = now.startOf("month");
    const sevenDaysAgo = now.minus({ days: 7 }).startOf("day");

    // -- Parallel fetch -------------------------------------------------------
    const [
      monthOrders,
      todayOrders,
      yesterdayOrders,
      allDailySummaries,
      recentDailySummaries,
      teamOfTodayRes,
    ] = await Promise.all([
      fetchApi<ExternalOrderSummary[]>(
        `${API_BASE}/order-summaries?start=${startOfMonth.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalOrderSummary[]>(
        `${API_BASE}/order-summaries?start=${midnightToday.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalOrderSummary[]>(
        `${API_BASE}/order-summaries?start=${midnightYesterday.toISO()}&end=${midnightYesterday.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalDailySummary[]>(`${API_BASE}/daily-summaries`),
      fetchApi<ExternalDailySummary[]>(
        `${API_BASE}/daily-summaries?start=${sevenDaysAgo.toFormat("yyyy-MM-dd")}&end=${now.toFormat("yyyy-MM-dd")}`,
      ),
      fetchApi<ExternalTeamOfToday>(`${API_BASE}/team-of-today`),
    ]);

    const teamOfToday = teamOfTodayRes.team;
    // const teamParam = teamOfToday !== "none" ? `&team=${teamOfToday}` : "";

    // conversion-tax depends on teamOfToday, so it runs after
    const [conversionTax, yesterdayConversionTax] = await Promise.all([
      fetchApi<ExternalConversionTax>(
        `${API_BASE}/conversion-tax?start=${midnightToday.toISO()}&end=${now.toISO()}`,
      ),
      fetchApi<ExternalConversionTax>(
        `${API_BASE}/conversion-tax?start=${midnightYesterday.toISO()}&end=${midnightToday.toISO()}`,
      ),
    ]);

    // -- Processing -----------------------------------------------------------

    // 1. Header Banner
    const headerBanner = buildHeaderBanner(allDailySummaries, now, teamOfToday);

    // 2. Monthly Ranking
    const monthlyRanking = buildMonthlyRanking(filterNonCancelled(monthOrders));

    // 3. Daily Ranking
    const dailyRanking = buildDailyRanking(filterNonCancelled(todayOrders));

    // 4. Operation KPIs (with yesterday comparison)
    const operationKpis = buildOperationKpis(
      todayOrders,
      yesterdayOrders,
      teamOfToday,
      conversionTax.conversionTax,
      yesterdayConversionTax.conversionTax,
    );

    // 5. Sales Race (daily summaries from the 1st of the current month)
    const monthStartStr = startOfMonth.toFormat("yyyy-MM-dd");
    const monthDailySummaries = allDailySummaries.filter(
      (ds) => ds.date >= monthStartStr,
    );
    const salesRace = buildSalesRace(monthDailySummaries, now, teamOfToday);

    // 6. Weekly Revenue Chart
    const weeklyRevenueChart = buildWeeklyRevenueChart(recentDailySummaries);

    // 7. Conquests
    const conquests = buildConquests(filterNonCancelled(monthOrders));

    const payload: OperationResponse = {
      headerBanner,
      monthlyRanking,
      dailyRanking,
      operationKpis,
      salesRace,
      weeklyRevenueChart,
      conquests,
    };

    // console.log(payload);

    return Response.json(
      { data: payload },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("[/api/operation] Error:", error);
    return Response.json(
      { error: "Failed to fetch operation data" },
      { status: 500 },
    );
  }
}

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

function sumTeamOrders(orders: ExternalOrderSummary[], team: string | null) {
  let filtered = filterNonCancelled(orders);
  if (team) filtered = filtered.filter((o) => o.team === team);
  let amount = 0;
  let cost = 0;
  for (const order of filtered) {
    amount += parseFloat(order.amount);
    cost += parseFloat(order.cost);
  }
  return { amount, cost };
}

function buildOperationKpis(
  todayOrders: ExternalOrderSummary[],
  yesterdayOrders: ExternalOrderSummary[],
  teamOfToday: string,
  conversionTax: number,
  yesterdayConversionTax: number,
): OperationResponse["operationKpis"] {
  const today = sumTeamOrders(todayOrders, teamOfToday);
  const yesterday = sumTeamOrders(yesterdayOrders, null);

  const repasse = today.amount > 0 ? today.cost / today.amount : 0;
  const yesterdayRepasse =
    yesterday.amount > 0 ? yesterday.cost / yesterday.amount : 0;

  const revenueChange =
    yesterday.amount > 0
      ? (today.amount - yesterday.amount) / yesterday.amount
      : null;
  const conversionTaxChange =
    yesterdayConversionTax > 0 ? conversionTax - yesterdayConversionTax : null;
  const repasseChange =
    yesterdayRepasse > 0 ? repasse - yesterdayRepasse : null;

  return {
    revenue: formatCurrency(today.amount),
    conversionTax,
    repasse,
    revenueChange,
    conversionTaxChange,
    repasseChange,
  };
}

function buildSalesRace(
  recentDailySummaries: ExternalDailySummary[],
  now: DateTime,
  teamOfToday: string,
): OperationResponse["salesRace"] {
  const todayStr = now.toFormat("yyyy-MM-dd");

  const teamAccum = new Map<
    string,
    {
      invoiceBeforeToday: number;
      costBeforeToday: number;
      daysBeforeToday: number;
    }
  >();

  let todayProfit = 0;

  for (const ds of recentDailySummaries) {
    const isToday = ds.date === todayStr;

    if (isToday) {
      if (ds.team === teamOfToday) {
        todayProfit = parseFloat(ds.invoice) - parseFloat(ds.cost);
      }
    } else {
      const team = ds.team;
      if (team === "none") continue;

      const entry = teamAccum.get(team);
      const invoice = Number(ds.invoice);
      const cost = Number(ds.cost);

      if (entry) {
        entry.invoiceBeforeToday += invoice;
        entry.costBeforeToday += cost;
        entry.daysBeforeToday += 1;
      } else {
        teamAccum.set(team, {
          invoiceBeforeToday: invoice,
          costBeforeToday: cost,
          daysBeforeToday: 1,
        });
      }
    }
  }

  const teams = Array.from(teamAccum.entries()).map(([name, data]) => {
    const averageProfit =
      data.daysBeforeToday > 0
        ? (data.invoiceBeforeToday - data.costBeforeToday) /
          data.daysBeforeToday
        : 0;
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

function buildConquests(
  orders: ExternalOrderSummary[],
): OperationResponse["conquests"] {
  return orders
    .slice()
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 9)
    .map((o) => ({
      name: (o.product?.name ?? "Produto")
        .replace(/^Coroa de Flores/i, "")
        .trim(),
      price: formatCurrency(parseFloat(o.amount), true),
      imageUrl: o.product?.imageUrl,
      sellerName: o.seller?.name,
    }));
}
