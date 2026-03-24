/* eslint-disable @next/next/no-img-element */
"use client";

import { useCarousel } from "@/app/(dashboard)/_hooks/use-carousel";
import type { OperationResponse } from "@/app/api/operation/types";
import { AVATAR_COLORS } from "@/data/dashboard";
import { useEffect, useRef, useState } from "react";
import { useDynamicPerPage } from "../../_hooks/use-dynamic-per-page";
import { celebrateTop1 } from "../_lib/celebrate-top1";
import { Carousel } from "./carousel";
import { RankingPage } from "./ranking-page";

function posColor(pos: number) {
  if (pos === 1) return "text-accent-gold";
  if (pos === 2) return "text-[#8C8C8C]";
  if (pos === 3) return "text-[#B87333]";
  return "text-text-muted";
}

// Row height: py-[9px]*2 + content ~34px + gap ~2px ≈ 54px
const ROW_HEIGHT = 54;

interface MonthlyRankingProps {
  data: OperationResponse["monthlyRanking"];
  referenceMonth: string;
}

export function MonthlyRanking({ data, referenceMonth }: MonthlyRankingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const perPage = useDynamicPerPage(containerRef, ROW_HEIGHT);
  const [prevTop, setPrevTop] = useState<string | null>(null);

  const currentTop = data[0]?.name ?? null;

  useEffect(() => {
    if (prevTop === null && currentTop !== null) {
      queueMicrotask(() => setPrevTop(currentTop));
    } else if (prevTop !== null && currentTop !== null && currentTop !== prevTop) {
      const audio = new Audio("/ka-ching.mp3");
      audio.play().catch(() => {});
      celebrateTop1(currentTop);
      queueMicrotask(() => setPrevTop(currentTop));
    }
  }, [currentTop, prevTop]);

  const effectivePerPage = perPage ?? 10;
  const totalPages = Math.ceil(data.length / effectivePerPage);
  const carousel = useCarousel(totalPages);

  const pages = Array.from({ length: totalPages }, (_, p) => {
    const slice = data.slice(p * effectivePerPage, (p + 1) * effectivePerPage);
    return (
      <RankingPage key={p}>
        {slice.map((v) => {
          const c = AVATAR_COLORS[(v.pos - 1) % AVATAR_COLORS.length];
          return (
            <div
              key={v.name}
              data-flip-key={v.name}
              className="grid grid-cols-[28px_36px_1fr_auto_auto_auto] items-center gap-2.5 py-[9px] px-3 rounded-[10px] bg-white"
            >
              <div
                className={`text-[13px] font-bold text-center ${posColor(v.pos)}`}
              >
                {v.pos}
              </div>
              {v.imageUrl ? (
                <img
                  src={v.imageUrl}
                  alt={v.name}
                  className="w-[34px] h-[34px] rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${c[0]}, ${c[1]})`,
                  }}
                >
                  {v.initials}
                </div>
              )}
              <div className="text-[13px] font-medium truncate">{v.name}</div>
              <div className="text-xs font-semibold text-center min-w-[32px]">
                {v.orders}
              </div>
              <div className="text-xs text-text-secondary text-center min-w-[52px]">
                {v.conversion ?? "-"}
              </div>
              <div className="text-xs text-text-muted text-right min-w-[70px]">
                {v.tm}
              </div>
            </div>
          );
        })}
      </RankingPage>
    );
  });

  return (
    <div className="bg-bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-[22px] pt-[18px] shrink-0">
        <div className="text-xs font-semibold uppercase tracking-[1.2px] text-text-secondary flex items-center gap-2">
          <span className="text-[15px]">📊</span> Desempenho Mensal
        </div>
        <div className="text-[11px] px-2.5 py-[3px] rounded-full font-medium bg-accent-green-light text-accent-green">
          {referenceMonth}
        </div>
      </div>
      <div className="px-[22px] pt-4 pb-[22px] flex-1 flex flex-col min-h-0">
        {/* Header row */}
        <div className="grid grid-cols-[28px_36px_1fr_auto_auto_auto] gap-2.5 px-3 pb-2 border-b border-border-light mb-1 shrink-0">
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            #
          </span>
          <span />
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            Vendedor
          </span>
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold text-center">
            Volume
          </span>
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold text-center">
            Conversão
          </span>
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold text-right">
            Ticket
          </span>
        </div>
        {/* Measurement container + carousel */}
        <div ref={containerRef} className="relative flex-1 min-h-0">
          {perPage !== null && <Carousel {...carousel}>{pages}</Carousel>}
        </div>
      </div>
    </div>
  );
}
