import type { ReactNode } from "react";

interface NoticeProps {
  tone: "error" | "info";
  title: string;
  children: ReactNode;
}

export function Notice({ tone, title, children }: NoticeProps) {
  const toneClass =
    tone === "error"
      ? "border-accent-red/30 bg-accent-red-light text-accent-red"
      : "border-accent-gold/40 bg-accent-gold-light text-text-primary";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-4 py-3 text-sm ${toneClass}`}
    >
      <span className="font-semibold">{title}.</span>
      {children}
    </div>
  );
}
