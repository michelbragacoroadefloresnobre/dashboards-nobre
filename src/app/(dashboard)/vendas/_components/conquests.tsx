/* eslint-disable @next/next/no-img-element */
"use client";

import { useCarousel } from "@/app/(dashboard)/_hooks/use-carousel";
import { conquistasData } from "@/data/dashboard";
import { Carousel } from "./carousel";

const PER_PAGE = 3;

export function Conquests() {
  const totalPages = Math.ceil(conquistasData.length / PER_PAGE);
  const carousel = useCarousel(totalPages);

  const pages = Array.from({ length: totalPages }, (_, p) => {
    const slice = conquistasData.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
    return (
      <div key={p} className="grid grid-cols-3 gap-3">
        {slice.map((c, i) => (
          <div
            key={i}
            className="text-center p-3.5 px-2.5 rounded-[10px] bg-bg-card-alt border border-border-light shadow-sm flex flex-col items-center"
          >
            {/* Área da Imagem do Produto */}
            <div className="w-20 h-20 rounded-xl mx-auto mb-2.5 bg-gradient-to-br from-[#e8e8e8] to-[#d4d4d4] flex items-center justify-center overflow-hidden shrink-0">
              {c.locked ? (
                <span className="text-3xl opacity-40">🔒</span>
              ) : c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-[30px]">{c.emoji}</span>
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
            <div className="text-[11px] font-medium text-text-muted mt-1.5 border-t border-border-light pt-1.5 truncate w-full">
              {c.sellerName ?? "—"}
            </div>
          </div>
        ))}
      </div>
    );
  });

  return (
    <div className="bg-bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-[22px] pt-[18px] shrink-0">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary flex items-center gap-2">
          <span className="text-[15px]">🎯</span> Conquistas do Mês
        </div>
      </div>
      <div className="px-[22px] pt-4 pb-[22px]">
        <div className="h-50">
          <Carousel {...carousel}>{pages}</Carousel>
        </div>
      </div>
    </div>
  );
}
