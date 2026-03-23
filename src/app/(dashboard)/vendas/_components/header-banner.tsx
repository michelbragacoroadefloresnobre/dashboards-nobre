import Image from "next/image";
import type { OperationResponse } from "@/app/api/operation/types";

interface HeaderBannerProps {
  data: OperationResponse["headerBanner"];
}

export function HeaderBanner({ data }: HeaderBannerProps) {
  const { highestRevenue, highestOrders, today } = data;

  return (
    <div className="col-span-full flex items-center justify-between bg-gradient-to-br from-[#2D6A4F] via-[#1B4332] to-[#0B2920] rounded-2xl px-8 py-5 text-white relative overflow-hidden animate-slide-down">
      {/* Decorative radial */}
      <div className="absolute -top-1/2 -right-[10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(200,150,62,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Left */}
      <div className="flex items-center gap-5 z-[1]">
        <Image
          src="/logo.png"
          alt="FloraHub"
          width={44}
          height={44}
          className="rounded-xl"
        />
        <div>
          <div className="font-display text-[22px] font-bold tracking-tight">
            Painel de Vendas
          </div>
          <div className="text-[13px] opacity-70 mt-0.5 font-light">
            Acompanhamento em tempo real
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="flex gap-8 z-[1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg bg-[rgba(200,150,62,0.2)]">
            <span className="animate-shimmer">🏆</span>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest opacity-60 font-medium">
              Maior Faturamento
            </div>
            <div className="text-lg font-bold tracking-tight">
              {highestRevenue.value}
            </div>
            <div className="text-[11px] opacity-50 mt-px">
              {highestRevenue.date} · {highestRevenue.team}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg bg-white/[0.12]">
            📦
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest opacity-60 font-medium">
              Mais Pedidos
            </div>
            <div className="text-lg font-bold tracking-tight">
              {highestOrders.value} pedidos
            </div>
            <div className="text-[11px] opacity-50 mt-px">
              {highestOrders.date} · {highestOrders.team}
            </div>
          </div>
        </div>
      </div>

      <div className="z-1 text-right">
        <div className="text-[13px] opacity-60">
          <span className="inline-block size-1.75 bg-[#4ADE80] rounded-full animate-pulse-dot" />
          &ensp;Ao vivo · {today.date} ·{" "}
          <span className="capitalize">{today.team}</span>
        </div>
      </div>
    </div>
  );
}
