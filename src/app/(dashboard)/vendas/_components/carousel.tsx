"use client";

import React from "react";

interface CarouselProps {
  currentPage: number;
  exitingPage: number | null;
  totalPages: number;
  children: React.ReactNode[];
}

export function Carousel({
  currentPage,
  exitingPage,
  totalPages,
  children,
}: CarouselProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 overflow-hidden min-h-0">
        {children.map((child, i) => {
          let cls = "carousel-page";
          if (i === currentPage) cls += " active";
          else if (i === exitingPage) cls += " exit-left";
          return (
            <div key={i} className={cls}>
              {child}
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.25 pt-2 pb-0.5 shrink-0">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-sm transition-all duration-300 ${
                i === currentPage ? "w-7 bg-accent-green" : "w-[18px] bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
