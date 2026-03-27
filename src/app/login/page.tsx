import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/login-form";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/vendas");

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-bg-card p-8 shadow-lg border border-border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">FloraHub</h1>
          <p className="text-sm text-text-secondary">
            Acesse sua conta para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
