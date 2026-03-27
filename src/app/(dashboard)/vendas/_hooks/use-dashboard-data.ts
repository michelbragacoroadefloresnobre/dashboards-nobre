import { useQuery } from "@tanstack/react-query";
import type { OperationResponse } from "@/app/api/operation/types";

export function useDashboardData(date?: string | null) {
  return useQuery<OperationResponse>({
    queryKey: ["operation", date ?? "live"],
    queryFn: async () => {
      const url = date ? `/api/operation?date=${date}` : "/api/operation";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Falha ao carregar dados do dashboard");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: date ? false : 60_000,
  });
}
