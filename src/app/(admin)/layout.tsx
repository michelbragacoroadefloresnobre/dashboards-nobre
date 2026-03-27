import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-bg">
      <header className="h-14 border-b border-border bg-white flex items-center px-6">
        <Link
          href="/vendas"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; Voltar ao painel
        </Link>
      </header>
      <main className="max-w-4xl mx-auto py-10 px-6">{children}</main>
    </div>
  );
}
