"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createUser } from "../_actions/create-user";

const inputClassName =
  "w-full rounded-lg border border-border bg-bg-card-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors";

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (password: string, userName: string) => void;
}

export function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: CreateUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const overlayRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      setError(undefined);
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;
    startTransition(async () => {
      const result = await createUser(null, formData);
      if (result.success && result.generatedPassword) {
        formRef.current?.reset();
        onCreated(result.generatedPassword, name);
      } else {
        setError(result.error);
      }
    });
  }

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
          <h2 className="text-lg font-bold text-text-primary">Novo usuário</h2>
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

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="create-name"
              className="block text-sm font-medium text-text-primary"
            >
              Nome
            </label>
            <input
              id="create-name"
              name="name"
              type="text"
              required
              className={inputClassName}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-email"
              className="block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="create-email"
              name="email"
              type="email"
              required
              className={inputClassName}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-role"
              className="block text-sm font-medium text-text-primary"
            >
              Cargo
            </label>
            <select
              id="create-role"
              name="role"
              required
              defaultValue=""
              className={inputClassName}
            >
              <option value="" disabled>
                Selecione um cargo
              </option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Visualizador</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-accent-red text-center">{error}</p>
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
              {isPending ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
