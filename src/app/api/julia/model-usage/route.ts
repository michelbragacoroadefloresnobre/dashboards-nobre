import { withAuth, withErrorHandler } from "@/lib/api-handler";
import { HttpException } from "@/lib/http-exception";
import { isJuliaAgent, JULIA_AGENTS } from "@/lib/julia-agents";
import { FILTER_PARAMS, parseAgentsParam } from "./filters";
import { resolveUsageRange } from "./range";
import type { JuliaModelUsageReport } from "./types";

const API_PATH = "/api/v1/dashboard/julia/model-usage";

async function fetchApi<T>(path: string): Promise<T> {
  const base = process.env.SISTEMA_CFN_URL;
  if (!base) throw new Error("SISTEMA_CFN_URL is not configured");

  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (res.status === 400) {
    // The main system validates the same inputs; forward its pt-BR message.
    const body = (await res.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    throw new HttpException(
      400,
      typeof body?.error === "string" ? body.error : "Parâmetros inválidos.",
    );
  }
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);

  const json = await res.json();
  return json.data as T;
}

function resolveAgents(params: URLSearchParams): string[] {
  const ids = parseAgentsParam(params.get(FILTER_PARAMS.agents));
  const unknown = ids.filter((id) => !isJuliaAgent(id));
  if (unknown.length) {
    throw new HttpException(
      400,
      `Agente desconhecido: ${unknown.join(", ")}. Válidos: ${JULIA_AGENTS.join(", ")}.`,
    );
  }
  return ids;
}

// GET /api/julia/model-usage
//   ?periodo=12h|24h|7d|30d|custom&inicio=YYYY-MM-DD&fim=YYYY-MM-DD&agentes=a,b
//
// Admin only. Resolves the page filters in America/Sao_Paulo and passes the
// report of the main system through unchanged (contract in the dashboard-api
// skill, "API de Custos da Julia").
export const GET = withErrorHandler(
  withAuth(
    async (request) => {
      const params = new URL(request.url).searchParams;
      const { start, end } = resolveUsageRange(params);
      const agents = resolveAgents(params);

      const query = new URLSearchParams({
        start: start.toUTC().toISO()!,
        end: end.toUTC().toISO()!,
      });
      if (agents.length) query.set("agents", agents.join(","));

      const report = await fetchApi<JuliaModelUsageReport>(
        `${API_PATH}?${query}`,
      );

      return Response.json(
        { data: report },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    },
    { minimumRole: "ADMIN" },
  ),
);
