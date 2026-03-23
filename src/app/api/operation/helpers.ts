import { DateTime } from "luxon";
import type { ExternalForm, ExternalOrderSummary } from "./types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const currencyFormatterWithDigit = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function formatCurrency(
  value: number,
  withDigit: boolean = false,
): string {
  if (withDigit) return currencyFormatterWithDigit.format(value);
  return currencyFormatter.format(value);
}

export function getInitials(name: string): string {
  if (!name) return "--";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDateBR(ymd: string): string {
  const dt = DateTime.fromISO(ymd);
  return dt.toFormat("dd/MM/yyyy");
}

export function formatDateShort(ymd: string): string {
  const dt = DateTime.fromISO(ymd);
  return dt.toFormat("dd/MM");
}

export function filterNonCancelled(
  orders: ExternalOrderSummary[],
): ExternalOrderSummary[] {
  return orders.filter((o) => o.status !== "CANCELLED");
}

function buildConversionMap(
  forms: ExternalForm[],
): Map<string, { converted: number; total: number }> {
  const map = new Map<string, { converted: number; total: number }>();
  for (const form of forms) {
    if (!form.seller) continue;
    if (form.seller.permission !== "comercial") continue;
    const key = form.seller.id;
    const entry = map.get(key);
    if (entry) {
      entry.total += 1;
      if (form.status === "CONVERTED") entry.converted += 1;
    } else {
      map.set(key, {
        converted: form.status === "CONVERTED" ? 1 : 0,
        total: 1,
      });
    }
  }
  return map;
}

export function buildMonthlyRanking(
  orders: ExternalOrderSummary[],
  forms: ExternalForm[],
) {
  const conversionMap = buildConversionMap(forms);
  const sellerMap = new Map<
    string,
    { name: string; fat: number; orders: number }
  >();

  for (const order of orders) {
    if (!order.seller) continue;
    if (order.seller.permission !== "comercial") continue;
    const key = order.seller.id;
    const entry = sellerMap.get(key);
    const amount = parseFloat(order.amount);

    if (entry) {
      entry.fat += amount;
      entry.orders += 1;
    } else {
      sellerMap.set(key, {
        name: order.seller.name,
        fat: amount,
        orders: 1,
      });
    }
  }

  const sellers = Array.from(sellerMap, ([id, s]) => ({
    id,
    ...s,
    tm: s.orders > 0 ? s.fat / s.orders : 0,
  }));

  sellers.sort((a, b) => {
    if (b.orders !== a.orders) return b.orders - a.orders;
    return b.tm - a.tm;
  });

  return sellers.map((s, i) => {
    const conv = conversionMap.get(s.id);
    return {
      pos: i + 1,
      initials: getInitials(s.name),
      name: s.name,
      orders: s.orders,
      conversion: conv
        ? `${Math.round((conv.converted / conv.total) * 100)}%`
        : null,
      tm: formatCurrency(s.tm, true),
    };
  });
}

export function buildDailyRanking(
  orders: ExternalOrderSummary[],
  forms: ExternalForm[],
  teamOfToday: string,
) {
  const conversionMap = buildConversionMap(forms);
  const sellerMap = new Map<
    string,
    { name: string; fat: number; orders: number }
  >();

  for (const order of orders) {
    if (!order.seller) continue;
    if (order.seller.permission !== "comercial") continue;
    if (order.seller.team !== teamOfToday) continue;
    const key = order.seller.id;
    const entry = sellerMap.get(key);
    const amount = parseFloat(order.amount);

    if (entry) {
      entry.fat += amount;
      entry.orders += 1;
    } else {
      sellerMap.set(key, {
        name: order.seller.name,
        fat: amount,
        orders: 1,
      });
    }
  }

  const sellers = Array.from(sellerMap, ([id, s]) => ({
    id,
    ...s,
    tm: s.orders > 0 ? s.fat / s.orders : 0,
  }));

  sellers.sort((a, b) => {
    if (b.orders !== a.orders) return b.orders - a.orders;
    return b.tm - a.tm;
  });

  return sellers.map((s, i) => {
    const conv = conversionMap.get(s.id);
    return {
      pos: i + 1,
      initials: getInitials(s.name),
      name: s.name,
      orders: s.orders,
      conversion: conv
        ? `${Math.round((conv.converted / conv.total) * 100)}%`
        : null,
      tm: formatCurrency(s.tm, true),
    };
  });
}
