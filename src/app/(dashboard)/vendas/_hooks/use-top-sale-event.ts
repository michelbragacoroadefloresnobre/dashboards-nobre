"use client";

import { usePusher } from "@/app/(dashboard)/_hooks/use-pusher";
import type { ExternalOrderSummary } from "@/app/api/operation/types";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

export interface TopSaleEvent {
  position: number;
  orderSummary: ExternalOrderSummary;
}

function fireConfetti() {
  const colors = ["#C8963E", "#2D6A4F", "#FFFFFF", "#FFF3D6"];

  // Burst from bottom-left
  confetti({
    particleCount: 60,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 1 },
    colors,
  });

  // Burst from bottom-right
  confetti({
    particleCount: 60,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 1 },
    colors,
  });
}

export function useTopSaleEvent() {
  const pusher = usePusher();
  const queryClient = useQueryClient();
  const [currentEvent, setCurrentEvent] = useState<TopSaleEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => setCurrentEvent(null), []);

  useEffect(() => {
    if (!pusher) return;

    const channel = pusher.subscribe("florahub-channel");

    channel.bind("top-sale-created", (data: TopSaleEvent) => {
      clearTimeout(timerRef.current);

      setCurrentEvent(data);

      // Play ka-ching sound at max volume
      const audio = new Audio("/ka-ching.mp3");
      audio.volume = 1;
      audio.play().catch(() => {});

      // Fire confetti
      fireConfetti();

      // Invalidate dashboard cache
      queryClient.invalidateQueries({ queryKey: ["operation"] });

      // Auto-dismiss after 5s
      timerRef.current = setTimeout(() => setCurrentEvent(null), 5000);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("florahub-channel");
      clearTimeout(timerRef.current);
    };
  }, [pusher, queryClient]);

  return { currentEvent, dismiss };
}
