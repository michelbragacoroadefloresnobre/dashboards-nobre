/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INTERVAL = 12000; // 30 seconds

export function useCarousel(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const [exitingPage, setExitingPage] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset to page 0 when totalPages changes (e.g. fullscreen toggle)
  useEffect(() => {
    setCurrentPage(0);
    setExitingPage(null);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    if (totalPages <= 1) return;
    setExitingPage(currentPage);
    setCurrentPage((prev) => (prev + 1) % totalPages);
    setTimeout(() => setExitingPage(null), 600);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (totalPages <= 1) return;
    timerRef.current = setInterval(goToNext, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goToNext, totalPages]);

  return { currentPage, exitingPage, totalPages };
}
