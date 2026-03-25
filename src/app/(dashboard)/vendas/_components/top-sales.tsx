/* eslint-disable @next/next/no-img-element */
"use client";

import type { OperationResponse } from "@/app/api/operation/types";

const TOTAL_SLOTS = 6;

interface TopSalesProps {
  data: OperationResponse["conquests"];
}

export function TopSales({ data }: TopSalesProps) {
  const slots = buildSlots(data);

  return (
    <div className="bg-bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-[22px] pt-3.5 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary flex items-center gap-2">
          <span className="text-[15px]">🎯</span> Maiores Vendas do Mês
        </div>
      </div>
      <div className="px-[22px] pt-3 pb-4">
        <div className="grid grid-cols-3 grid-rows-2 gap-2.5">
          {slots.map((c, i) => (
            <div
              key={i}
              className={`text-center py-2.5 px-2.5 rounded-[10px] border border-border-light shadow-sm flex flex-col items-center ${
                c.locked ? "bg-bg-card-alt/60 opacity-50" : "bg-bg-card-alt"
              }`}
            >
              {/* Área da Imagem do Vendedor */}
              <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-linear-to-br from-[#e8e8e8] to-[#d4d4d4] flex items-center justify-center overflow-hidden shrink-0">
                {c.locked ? (
                  <span className="text-2xl opacity-40">🔒</span>
                ) : c.sellerImageUrl ? (
                  <img
                    src={c.sellerImageUrl}
                    alt={c.sellerName ?? c.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <img src="/logo.png" alt="FloraHub" className="w-7.5 h-7.5" />
                )}
              </div>

              {/* Nome do produto */}
              <div className="text-[11.5px] font-medium text-text-primary mb-0.5 truncate w-full">
                {c.name}
              </div>

              {/* Valor da venda */}
              <div
                className={`text-xs font-semibold ${c.locked ? "text-text-muted" : "text-accent-green"}`}
              >
                {c.price}
              </div>

              {/* Nome do Vendedor */}
              <div className="text-[11px] font-medium text-text-muted mt-1 border-t border-border-light pt-1 truncate w-full">
                {c.sellerName ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Slot {
  name: string;
  price: string;
  imageUrl?: string;
  sellerName?: string;
  sellerImageUrl?: string | null;
  locked: boolean;
}

function buildSlots(conquests: OperationResponse["conquests"]): Slot[] {
  const filled: Slot[] = conquests.slice(0, TOTAL_SLOTS).map((c) => ({
    ...c,
    locked: false,
  }));

  const remaining = TOTAL_SLOTS - filled.length;
  for (let i = 0; i < remaining; i++) {
    filled.push({
      name: "Em breve",
      price: "???",
      locked: true,
    });
  }

  return filled;
}
