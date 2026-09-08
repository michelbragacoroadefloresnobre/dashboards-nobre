import { requireRole } from "@/lib/auth-utils";
import { Suspense } from "react";
import { JuliaUsageDashboard } from "./_components/julia-usage-dashboard";

export const metadata = { title: "Relatório da Julia" };

export default async function JuliaPage() {
  // Administrators only; everyone else is sent back to /vendas.
  await requireRole("ADMIN");

  // The dashboard reads its filters with useSearchParams(), which needs a
  // Suspense boundary above it.
  return (
    <Suspense fallback={null}>
      <JuliaUsageDashboard />
    </Suspense>
  );
}
