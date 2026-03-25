/* eslint-disable @next/next/no-img-element */
"use client";

import type { TopSaleEvent } from "@/app/(dashboard)/vendas/_hooks/use-top-sale-event";
import { AVATAR_COLORS } from "@/data/dashboard";
import { useEffect, useState } from "react";

interface TopSaleCelebrationProps {
  event: TopSaleEvent;
  onDismiss: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function ordinalLabel(position: number): string {
  return `${position}ª maior venda do mês!`;
}

export function TopSaleCelebration({
  event,
  onDismiss,
}: TopSaleCelebrationProps) {
  const [closing, setClosing] = useState(false);
  const { orderSummary, position } = event;
  const seller = orderSummary.seller;
  const product = orderSummary.product;

  const initials = seller ? getInitials(seller.name) : "?";
  const avatarColor = AVATAR_COLORS[position % AVATAR_COLORS.length];

  useEffect(() => {
    const fadeTimer = setTimeout(() => setClosing(true), 6700);
    const dismissTimer = setTimeout(onDismiss, 7000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${
        closing ? "animate-celebration-out" : "animate-celebration-backdrop"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-5 rounded-2xl border border-border bg-bg-card px-10 py-8 shadow-xl min-w-[360px] max-w-[440px] ${
          closing ? "animate-celebration-out" : "animate-celebration-card"
        }`}
      >
        {/* Label */}
        <div
          className="animate-celebration-item text-xs font-semibold uppercase tracking-[1.6px] text-accent-gold"
          style={{ animationDelay: "0.1s" }}
        >
          🏆 Uma das Maiores Vendas
        </div>

        {/* Position badge */}
        <div
          className="animate-celebration-item flex h-14 w-14 items-center justify-center rounded-full bg-accent-gold-light"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="font-display text-xl font-bold text-accent-gold">
            {position}ª
          </span>
        </div>

        {/* Seller photo */}
        <div
          className="animate-celebration-item"
          style={{ animationDelay: "0.3s" }}
        >
          {seller?.imageUrl ? (
            <img
              src={seller.imageUrl}
              alt={seller.name}
              className="h-20 w-20 rounded-full object-cover border-2 border-accent-gold-light"
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-semibold text-white border-2 border-accent-gold-light"
              style={{
                background: `linear-gradient(135deg, ${avatarColor[0]}, ${avatarColor[1]})`,
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Seller name */}
        <div
          className="animate-celebration-item text-center"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="font-display text-xl font-bold text-text-primary">
            Parabéns, {seller?.name ?? "Vendedor"}!
          </div>
          <div className="mt-1 text-sm text-text-secondary">
            {ordinalLabel(position)}
          </div>
        </div>

        {/* Divider */}
        <div
          className="animate-celebration-item w-full border-t border-border-light"
          style={{ animationDelay: "0.45s" }}
        />

        {/* Product & Amount */}
        <div
          className="animate-celebration-item flex flex-col items-center gap-1.5"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="text-sm font-medium text-text-secondary">
            {product?.name ?? "Produto"}
          </div>
          <div className="text-2xl font-bold text-accent-gold">
            {formatCurrency(orderSummary.amount)}
          </div>
        </div>
      </div>
    </div>
  );
}
