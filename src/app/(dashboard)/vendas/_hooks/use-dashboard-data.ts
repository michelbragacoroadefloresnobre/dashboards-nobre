import { useQuery } from "@tanstack/react-query";
import type { OperationResponse } from "@/app/api/operation/types";

export function useDashboardData() {
  return useQuery<OperationResponse>({
    queryKey: ["operation"],
    queryFn: async () => {
      const res = await fetch("/api/operation");
      if (!res.ok) throw new Error("Falha ao carregar dados do dashboard");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });
}
