"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const name = user?.name ?? "Usuário";
  const email = user?.email ?? "";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const role = (user as { role?: string } | undefined)?.role;
  const canManageUsers = role === "ADMIN" || role === "SUPER_ADMIN";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-6 py-4 border-t border-border-light hover:bg-bg-card-alt transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-card-alt border border-border-light flex items-center justify-center text-xs font-semibold text-text-secondary">
            {initials}
          </div>
          <div className="min-w-0 text-left flex-1">
            <div className="text-[12.5px] font-medium text-text-primary truncate">
              {name}
            </div>
            <div className="text-[11px] text-text-muted truncate">{email}</div>
          </div>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown (opens upward) */}
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] text-text-secondary hover:bg-bg-card-alt transition-colors"
          >
            Meu perfil
          </Link>
          {canManageUsers && (
            <Link
              href="/usuarios"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[13px] text-text-secondary hover:bg-bg-card-alt transition-colors"
            >
              Gerenciar usuários
            </Link>
          )}
          <div className="border-t border-border-light my-1" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full text-left px-4 py-2.5 text-[13px] text-accent-red hover:bg-bg-card-alt transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
