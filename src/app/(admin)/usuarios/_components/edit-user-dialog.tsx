"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateUser } from "../_actions/update-user";

const inputClassName =
  "w-full rounded-lg border border-border bg-bg-card-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors";

type Role = "SUPER_ADMIN" | "ADMIN" | "VIEWER";

interface UserToEdit {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  user: UserToEdit | null;
}

export function EditUserDialog({
  open,
  onClose,
  onUpdated,
  user,
}: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const overlayRef = useRef<HTMLDivElement>(null);

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
    startTransition(async () => {
      const result = await updateUser(null, formData);
      if (result.success) {
        onUpdated();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open || !user) return null;

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
            Editar usuário
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

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          <div className="space-y-1.5">
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-text-primary"
            >
              Nome
            </label>
            <input
              id="edit-name"
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              required
              defaultValue={user.email}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-role"
              className="block text-sm font-medium text-text-primary"
            >
              Cargo
            </label>
            <select
              id="edit-role"
              name="role"
              required
              defaultValue={user.role}
              className={inputClassName}
            >
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
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
