"use client";

import { useFlip } from "@/app/(dashboard)/_hooks/use-flip";
import type { ReactNode } from "react";

export function RankingPage({ children }: { children: ReactNode }) {
  const flipRef = useFlip();
  return (
    <div ref={flipRef} className="flex flex-col gap-0.5">
      {children}
    </div>
  );
}
