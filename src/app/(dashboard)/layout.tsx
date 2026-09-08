import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasMinRole, type AuthenticatedUser } from "@/lib/auth-utils";
import { AppShell } from "@/app/(dashboard)/_components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  // Admin-only entries (Relatório da Julia) are hidden from other users.
  const user = session.user as unknown as AuthenticatedUser | undefined;
  const isAdmin = user ? hasMinRole(user.role, "ADMIN") : false;

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
