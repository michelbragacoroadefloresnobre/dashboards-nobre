"use client";

import { FabMenu } from "@/app/(dashboard)/_components/fab-menu";
import { Sidebar } from "@/app/(dashboard)/_components/sidebar";
import { useFullscreen } from "@/app/(dashboard)/_hooks/use-fullscreen";
import { useZoom } from "@/app/(dashboard)/_hooks/use-zoom";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { zoomLevel, zoomIn, zoomOut, isMaxZoom, isMinZoom } = useZoom();

  return (
    <div className="h-screen overflow-hidden">
      <div
        className="flex h-full origin-top-left"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          width: `${10000 / zoomLevel}%`,
          height: `${10000 / zoomLevel}%`,
        }}
      >
        {/* Sidebar — hidden in fullscreen */}
        {!isFullscreen && <Sidebar />}

        {/* Dashboard content area */}
        <main className="flex-1 h-full overflow-hidden">
          {children}
        </main>
      </div>

      {/* Floating action menu — always visible, outside main to avoid zoom */}
      <FabMenu
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        zoomLevel={zoomLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        isMaxZoom={isMaxZoom}
        isMinZoom={isMinZoom}
      />
    </div>
  );
}
