"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos.");
        return;
      }

      router.push("/vendas");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
