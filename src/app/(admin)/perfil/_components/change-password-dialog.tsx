"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "../_actions/change-password";

const inputClassName =
  "w-full rounded-lg border border-border bg-bg-card-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({
  open,
  onClose,
}: ChangePasswordDialogProps) {
  const [state, formAction, isPending] = useActionState(changePassword, null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      const timeout = setTimeout(onClose, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state?.success, onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">
            Alterar senha
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-text-primary"
            >
              Senha atual
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className={inputClassName}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-text-primary"
            >
              Nova senha
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              className={inputClassName}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-primary"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className={inputClassName}
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-accent-red text-center">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-accent-green text-center">
              {state.success}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-card-alt transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-accent-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Salvando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
