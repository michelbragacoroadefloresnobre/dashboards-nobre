"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "dashboard-zoom";
const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const STEP = 10;

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState(100);

  // Sync from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (parsed >= MIN_ZOOM && parsed <= MAX_ZOOM && parsed !== 100) {
        setZoomLevel(parsed);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(zoomLevel));
  }, [zoomLevel]);

  const zoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(z + STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(z - STEP, MIN_ZOOM));
  }, []);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    isMaxZoom: zoomLevel >= MAX_ZOOM,
    isMinZoom: zoomLevel <= MIN_ZOOM,
  };
}
