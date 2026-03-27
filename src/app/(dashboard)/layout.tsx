import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/app/(dashboard)/_components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
