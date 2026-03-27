"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

interface SidebarItem {
  id: string;
  href: string;
  label: string;
  icon: string;
}

const dashboards: SidebarItem[] = [
  { id: "vendas", href: "/vendas", label: "Vendas", icon: "📊" },
  { id: "financeiro", href: "/financeiro", label: "Financeiro", icon: "💰" },
  { id: "estoque", href: "/estoque", label: "Estoque", icon: "📦" },
  { id: "marketing", href: "/marketing", label: "Marketing", icon: "📣" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[256px] h-full bg-white border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-border-light">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="FloraHub"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <div className="font-display text-[17px] font-bold text-text-primary tracking-tight leading-tight">
              FloraHub
            </div>
            <div className="text-[11px] text-text-muted font-medium">
              Painel Gerencial
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 pt-5">
        <div className="text-[10px] uppercase tracking-[1.5px] text-text-muted font-semibold px-3 mb-2">
          Dashboards
        </div>
        <nav className="flex flex-col gap-1">
          {dashboards.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-accent-green/[0.08] text-accent-green"
                    : "text-text-secondary hover:bg-bg-card-alt hover:text-text-primary"
                }`}
              >
                <span className="text-[18px] leading-none">{item.icon}</span>
                <span className={`text-[13.5px] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-green" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <UserMenu />
    </aside>
  );
}
