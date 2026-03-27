"use client";

import { useEffect, useRef, useState } from "react";

interface GeneratedPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  password: string;
  userName: string;
}

export function GeneratedPasswordDialog({
  open,
  onClose,
  password,
  userName,
}: GeneratedPasswordDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      setCopied(false);
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  if (!open) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Senha gerada
            </h2>
            <p className="text-xs text-text-muted">
              Para {userName}
            </p>
          </div>
        </div>

        <div className="bg-bg-card-alt border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <code className="text-lg font-mono font-bold text-text-primary tracking-wider">
              {password}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-white transition-colors cursor-pointer"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
          Esta senha será exibida apenas uma vez. Anote-a e repasse ao usuário.
          O usuário poderá alterar a senha depois no perfil.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-accent-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
