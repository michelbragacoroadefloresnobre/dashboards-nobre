"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteUser } from "../_actions/delete-user";

interface UserToDelete {
  id: string;
  name: string;
  email: string;
}

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  user: UserToDelete | null;
}

export function DeleteUserDialog({
  open,
  onClose,
  onDeleted,
  user,
}: DeleteUserDialogProps) {
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
      const result = await deleteUser(null, formData);
      if (result.success) {
        onDeleted();
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-accent-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Excluir usuário
            </h2>
            <p className="text-xs text-text-muted">
              Esta ação não pode ser desfeita
            </p>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-5">
          Tem certeza que deseja excluir permanentemente o usuário{" "}
          <strong className="text-text-primary">{user.name}</strong>{" "}
          ({user.email})?
        </p>

        {error && (
          <p className="text-sm text-accent-red text-center mb-4">
            {error}
          </p>
        )}

        <form action={handleSubmit}>
          <input type="hidden" name="userId" value={user.id} />

          <div className="flex gap-3">
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
              className="flex-1 rounded-lg bg-accent-red py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
