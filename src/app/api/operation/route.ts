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
      fetchApi<ExternalDailySummary[]>(`${API_BASE}/daily-team-summaries`),
      fetchApi<ExternalDailySummary[]>(
        `${API_BASE}/daily-team-summaries?start=${sevenDaysAgo.toFormat("yyyy-MM-dd")}&end=${now.toFormat("yyyy-MM-dd")}`,
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
      allDailySummaries,
      now,
      teamOfToday,
      conversionTax.conversionTax,
      yesterdayConversionTax.conversionTax,
    );

    // 5. Sales Race (daily summaries from the 1st of the current month)
    const monthStartStr = startOfMonth.toFormat("yyyy-MM-dd");
    const monthDailySummaries = allDailySummaries.filter(
      (ds) => ds.date >= monthStartStr,
    );
    const salesRace = buildSalesRace(
      filterNonCancelled(monthOrders),
      monthDailySummaries,
      now,
      teamOfToday,
    );

    // 6. Weekly Revenue Chart
    const weeklyRevenueChart = buildWeeklyRevenueChart(recentDailySummaries);

    // 7. Conquests
    const conquests = buildConquests(filterNonCancelled(monthOrders));

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
  const todayCost = todaySummary ? parseFloat(todaySummary.cost) : 0;
  const yesterdayInvoice = yesterdaySummary
    ? parseFloat(yesterdaySummary.invoice)
    : 0;
  const yesterdayCost = yesterdaySummary
    ? parseFloat(yesterdaySummary.cost)
    : 0;

  const repasse = todayInvoice > 0 ? todayCost / todayInvoice : 0;
  const yesterdayRepasse =
    yesterdayInvoice > 0 ? yesterdayCost / yesterdayInvoice : 0;

  const revenueChange =
    yesterdayInvoice > 0
      ? (todayInvoice - yesterdayInvoice) / yesterdayInvoice
      : null;
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

function buildSalesRace(
  monthOrders: ExternalOrderSummary[],
  monthDailySummaries: ExternalDailySummary[],
  now: DateTime,
  teamOfToday: string,
): OperationResponse["salesRace"] {
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
  if (todaySummary) {
    todayProfit = parseFloat(todaySummary.invoice) - parseFloat(todaySummary.cost);
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
