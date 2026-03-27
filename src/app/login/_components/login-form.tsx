"use client";

import { useActionState } from "react";
import { login } from "../_actions/login";

export function LoginForm() {
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-primary"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="w-full rounded-lg border border-border bg-bg-card-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-primary"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-bg-card-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-accent-red text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
