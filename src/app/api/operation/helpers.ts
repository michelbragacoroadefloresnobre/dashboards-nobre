import { DateTime } from "luxon";
import type { ExternalOrderSummary } from "./types";

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

export function buildMonthlyRanking(orders: ExternalOrderSummary[]) {
  const sellerMap = new Map<
    string,
    { name: string; fat: number; orders: number }
  >();

  for (const order of orders) {
    if (!order.seller) continue;
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

  const sellers = Array.from(sellerMap.values()).map((s) => ({
    ...s,
    tm: s.orders > 0 ? s.fat / s.orders : 0,
  }));

  sellers.sort((a, b) => {
    if (b.fat !== a.fat) return b.fat - a.fat;
    if (b.tm !== a.tm) return b.tm - a.tm;
    return b.orders - a.orders;
  });

  return sellers.map((s, i) => ({
    pos: i + 1,
    initials: getInitials(s.name),
    name: s.name,
    fat: formatCurrency(s.fat),
    orders: s.orders,
    tm: formatCurrency(s.tm, true),
  }));
}

export function buildDailyRanking(orders: ExternalOrderSummary[]) {
  const sellerMap = new Map<
    string,
    { name: string; fat: number; orders: number }
  >();

  for (const order of orders) {
    if (!order.seller) continue;
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

  const sellers = Array.from(sellerMap.values()).map((s) => ({
    ...s,
    tm: s.orders > 0 ? s.fat / s.orders : 0,
  }));

  sellers.sort((a, b) => {
    if (b.fat !== a.fat) return b.fat - a.fat;
    if (b.tm !== a.tm) return b.tm - a.tm;
    return b.orders - a.orders;
  });

  return sellers.map((s, i) => ({
    pos: i + 1,
    initials: getInitials(s.name),
    name: s.name,
    fat: formatCurrency(s.fat),
    orders: s.orders,
    tm: formatCurrency(s.tm, true),
  }));
}
