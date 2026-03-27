import { Metadata } from "next";
import { requireRole } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Gerenciar usuários",
};

export default async function UsersPage() {
  await requireRole("ADMIN");

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary">
        Gerenciar usuários
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Em breve você poderá gerenciar os usuários do sistema aqui.
      </p>
    </div>
  );
}
