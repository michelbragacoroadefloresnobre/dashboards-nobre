"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const STORAGE_KEY = "fab-position";
const DRAG_THRESHOLD = 5;

interface Position {
  bottom: number;
  right: number;
}

const DEFAULT_POSITION: Position = { bottom: 24, right: 24 };

export function useDrag() {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const justDraggedRef = useRef(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Sync from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Position;
        if (typeof parsed.bottom === "number" && typeof parsed.right === "number") {
          setPosition(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const startRight = position.right;
      const startBottom = position.bottom;
      let dragging = false;

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!dragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
          return;
        }
        dragging = true;

        const newRight = Math.max(
          0,
          Math.min(startRight - dx, window.innerWidth - 48),
        );
        const newBottom = Math.max(
          0,
          Math.min(startBottom - dy, window.innerHeight - 48),
        );

        const el = elementRef.current;
        if (el) {
          el.style.right = `${newRight}px`;
          el.style.bottom = `${newBottom}px`;
        }
      }

      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        if (dragging) {
          justDraggedRef.current = true;
          const el = elementRef.current;
          if (el) {
            const newRight =
              parseInt(el.style.right) || DEFAULT_POSITION.right;
            const newBottom =
              parseInt(el.style.bottom) || DEFAULT_POSITION.bottom;
            setPosition({ bottom: newBottom, right: newRight });
          }
          // Keep justDragged true long enough to block the click event
          requestAnimationFrame(() => {
            justDraggedRef.current = false;
          });
        }
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [position],
  );

  return {
    position,
    elementRef,
    justDraggedRef,
    onPointerDown,
  };
}
