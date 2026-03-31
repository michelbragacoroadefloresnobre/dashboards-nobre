import { withAuth, withErrorHandler } from "@/lib/api-handler";
import { hasMinRole } from "@/lib/auth-utils";
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
    // -- Date override (admin only) -------------------------------------------
    const dateParam = new URL(_request.url).searchParams.get("date");
    const isAdmin = hasMinRole(_session.user.role, "ADMIN");
    const overrideDate = isAdmin && dateParam ? dateParam : null;
    const isHistorical = overrideDate !== null;

    const now = overrideDate
      ? DateTime.fromISO(overrideDate, { zone: TIMEZONE }).set({
          hour: 23,
          minute: 59,
          second: 59,
        })
      : DateTime.now().setZone(TIMEZONE);

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
      isHistorical
        ? Promise.resolve(null)
        : fetchApi<ExternalTeamOfToday>(`${API_BASE}/team-of-today`),
      fetchApi<ExternalOrderSummary[]>(
        `${API_BASE}/top-sales${overrideDate ? `?date=${overrideDate}` : ""}`,
      ),
    ]);

    const teamOfToday = isHistorical
      ? deriveTeamFromSummaries(allDailySummaries, now.toFormat("yyyy-MM-dd"))
      : teamOfTodayRes!.team;

    // Fetch forms for conversion rate calculation
    const [monthForms, todayForms, yesterdayForms] = await Promise.all([
      fetchApi<ExternalForm[]>(
        `${API_BASE}/forms?start=${startOfMonth.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalForm[]>(
        `${API_BASE}/forms?start=${midnightToday.toISO()}&end=${now.endOf("day").toISO()}`,
      ),
      fetchApi<ExternalForm[]>(
        `${API_BASE}/forms?start=${midnightYesterday.toISO()}&end=${midnightYesterday.endOf("day").toISO()}`,
      ),
    ]);

    const conversionTax = computeConversionTax(todayForms, teamOfToday);
    const yesterdayConversionTax = computeConversionTax(yesterdayForms);

    // -- Processing -----------------------------------------------------------

    // 1. Header Banner (filter summaries up to the reference date)
    const nowStr = now.toFormat("yyyy-MM-dd");
    const summariesUntilNow = allDailySummaries.filter(
      (ds) => ds.date <= nowStr,
    );
    const headerBanner = buildHeaderBanner(summariesUntilNow, now, teamOfToday);

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

    // 5. Sales Race (conversion rate per team for the current month)
    const salesProgress = buildSalesProgress(monthForms);

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
      isHistorical,
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

function computeConversionTax(
  forms: ExternalForm[],
  team?: string,
): number {
  const filtered = team ? forms.filter((f) => f.team === team) : forms;
  if (filtered.length === 0) return 0;
  const converted = filtered.filter((f) => f.status === "CONVERTED").length;
  return converted / filtered.length;
}

function buildSalesProgress(
  monthForms: ExternalForm[],
): OperationResponse["salesProgress"] {
  const teamNames = ["tulum", "dubai"] as const;

  const teams = teamNames
    .map((name) => ({
      name,
      conversionRate: computeConversionTax(monthForms, name),
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);

  const conversionDifference =
    teams.length >= 2 ? teams[0].conversionRate - teams[1].conversionRate : 0;

  return { teams, conversionDifference };
}

function deriveTeamFromSummaries(
  summaries: ExternalDailySummary[],
  dateStr: string,
): string {
  const daySummary = summaries.find((ds) => ds.date === dateStr);
  return daySummary?.team || "none";
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
