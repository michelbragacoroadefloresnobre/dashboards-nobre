"use client";

import { useDrag } from "@/app/(dashboard)/_hooks/use-drag";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface FabMenuProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isMaxZoom: boolean;
  isMinZoom: boolean;
}

interface FabAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  closesMenu?: boolean;
}

function ZoomInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="8" cy="16" r="2.5" />
      <circle cx="16" cy="16" r="2.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function FabMenu({
  isFullscreen,
  onToggleFullscreen,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  isMaxZoom,
  isMinZoom,
}: FabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { position, elementRef, justDraggedRef, onPointerDown } = useDrag();

  const actions: FabAction[] = [
    {
      label: "Atualizar dados",
      icon: <RefreshIcon />,
      onClick: () => queryClient.invalidateQueries(),
      closesMenu: true,
    },
    {
      label: isFullscreen ? "Sair da tela cheia" : "Tela cheia",
      icon: isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />,
      onClick: onToggleFullscreen,
      closesMenu: true,
    },
    {
      label: `Diminuir zoom`,
      icon: <ZoomOutIcon />,
      onClick: onZoomOut,
      disabled: isMinZoom,
    },
    {
      label: `Aumentar zoom`,
      icon: <ZoomInIcon />,
      onClick: onZoomIn,
      disabled: isMaxZoom,
    },
  ];

  function handleMainClick() {
    if (justDraggedRef.current) return;
    setIsOpen((prev) => !prev);
  }

  function handleActionClick(action: FabAction) {
    if (action.disabled) return;
    action.onClick();
    if (action.closesMenu) setIsOpen(false);
  }

  return (
    <div
      ref={elementRef}
      className="fixed z-50 origin-bottom-right transition-transform duration-200"
      style={{
        bottom: position.bottom,
        right: position.right,
        transform: `scale(${Math.max(zoomLevel / 100, 0.5)})`,
      }}
    >
      {/* Action items */}
      {isOpen && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-2.5">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className="fab-action-enter relative w-12 h-12 rounded-full bg-accent-green text-white shadow-[0_4px_12px_rgba(45,106,79,0.3)] flex items-center justify-center hover:bg-[#245A42] active:scale-95 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed group/action"
              style={{ "--fab-index": i } as React.CSSProperties}
            >
              {action.icon}
              {/* Tooltip */}
              <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-text-primary text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={handleMainClick}
        onPointerDown={!isOpen ? onPointerDown : undefined}
        className="w-12 h-12 rounded-full bg-accent-green text-white shadow-[0_4px_20px_rgba(45,106,79,0.35)] flex items-center justify-center hover:bg-[#245A42] active:scale-95 transition-all duration-200 touch-none select-none"
      >
        {isOpen ? <CloseIcon /> : <GridIcon />}
      </button>

      {/* Zoom badge */}
      {zoomLevel !== 100 && (
        <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-accent-gold text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
          {zoomLevel}%
        </span>
      )}
    </div>
  );
}
