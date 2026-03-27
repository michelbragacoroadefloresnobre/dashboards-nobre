"use client";

import { useSession } from "next-auth/react";
import { useActionState, useRef, useState } from "react";
import { updateProfile } from "../_actions/update-profile";
import { ChangePasswordDialog } from "./change-password-dialog";

type Role = "SUPER_ADMIN" | "ADMIN" | "VIEWER";

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  VIEWER: "Visualizador",
};

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    role: Role;
    createdAt: string;
  };
}

const inputClassName =
  "w-full rounded-lg border border-border bg-bg-card-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { update: updateSession } = useSession();
  const [state, formAction, isPending] = useActionState(
    async (
      prev: { error?: string; success?: string } | null,
      formData: FormData,
    ) => {
      const result = await updateProfile(prev, formData);
      if (result.success) {
        await updateSession({});
      }
      return result;
    },
    null,
  );
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const formRef = useRef<HTMLFormElement>(null);

  const nameChanged = nameValue.trim() !== user.name;

  return (
    <>
      {/* Header */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent-green/10 border-2 border-accent-green/20 flex items-center justify-center text-xl font-bold text-accent-green shrink-0">
            {getInitials(nameValue || user.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary truncate">
              {nameValue || user.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center rounded-md bg-accent-green/10 px-2 py-0.5 text-xs font-medium text-accent-green">
                {roleLabels[user.role]}
              </span>
              <span className="text-xs text-text-muted">
                Membro desde {formatDate(user.createdAt)}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Informações pessoais */}
      <div className="bg-white border border-border rounded-xl p-6 mt-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Informações pessoais
        </h2>

        <form ref={formRef} action={formAction}>
          {/* Nome — editável */}
          <div className="space-y-1.5 mb-5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-text-muted"
            >
              Nome
            </label>
            <div className="flex gap-2">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className={inputClassName}
                placeholder="Seu nome"
              />
              {nameChanged && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="shrink-0 rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Salvando..." : "Salvar"}
                </button>
              )}
            </div>
          </div>

          {/* Feedback */}
          {state?.error && (
            <p className="text-sm text-accent-red mb-4">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-accent-green mb-4">{state.success}</p>
          )}
        </form>

        {/* Campos read-only */}
        <div className="grid grid-cols-2 gap-5 pt-4 border-t border-border-light">
          <div>
            <span className="block text-xs font-medium text-text-muted mb-1">
              Email
            </span>
            <span className="text-sm text-text-primary">{user.email}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-text-muted mb-1">
              Cargo
            </span>
            <span className="text-sm text-text-primary">
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white border border-border rounded-xl p-6 mt-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Segurança
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg-card-alt border border-border-light flex items-center justify-center">
              <svg
                className="w-4 h-4 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <span className="block text-sm font-medium text-text-primary">
                Senha
              </span>
              <span className="text-xs text-text-muted">••••••••</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPasswordDialogOpen(true)}
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-bg-card-alt transition-colors cursor-pointer"
          >
            Alterar
          </button>
        </div>
      </div>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
    </>
  );
}
