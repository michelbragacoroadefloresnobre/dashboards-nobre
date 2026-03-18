"use client";

import { useState, useEffect, RefObject } from "react";

const MIN_ROWS = 3;

/**
 * Measures the available height of a container ref and calculates
 * how many rows of a given height fit inside.
 * Recalculates automatically when the container resizes (e.g. fullscreen toggle).
 * Returns null until measured (use this to hide content until ready).
 */
export function useDynamicPerPage(
  containerRef: RefObject<HTMLDivElement | null>,
  rowHeight: number
): number | null {
  const [perPage, setPerPage] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const available = el.clientHeight;
      const fits = Math.floor(available / rowHeight);
      setPerPage(Math.max(fits, MIN_ROWS));
    };

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [containerRef, rowHeight]);

  return perPage;
}
