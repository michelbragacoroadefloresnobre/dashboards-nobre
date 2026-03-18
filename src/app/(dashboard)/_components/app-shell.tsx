"use client";

import { FullscreenButton } from "@/app/(dashboard)/_components/fullscreen-button";
import { Sidebar } from "@/app/(dashboard)/_components/sidebar";
import { useFullscreen } from "@/app/(dashboard)/_hooks/use-fullscreen";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden in fullscreen */}
      {!isFullscreen && <Sidebar />}

      {/* Dashboard content area */}
      <main className="flex-1 h-screen overflow-hidden">{children}</main>

      {/* Floating fullscreen button — always visible */}
      <FullscreenButton
        isFullscreen={isFullscreen}
        onToggle={toggleFullscreen}
      />
    </div>
  );
}
