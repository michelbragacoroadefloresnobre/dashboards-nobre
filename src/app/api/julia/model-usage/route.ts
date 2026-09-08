import { withAuth, withErrorHandler } from "@/lib/api-handler";
import { HttpException } from "@/lib/http-exception";
import { isJuliaAgent, JULIA_AGENTS } from "@/lib/julia-agents";
import { FILTER_PARAMS, parseAgentsParam } from "./filters";
import {
  normalizeUsageReport,
  type RawJuliaModelUsageReport,
} from "./normalize";
import { resolveUsageRange } from "./range";

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
//   ?periodo=12h|24h|7d|30d|custom&inicio=YYYY-MM-DD&fim=YYYY-MM-DD
//   &horaInicio=HH:mm&horaFim=HH:mm&agentes=a,b
//
// `horaInicio`/`horaFim` only apply to `custom` and default to 00:00: the
// window is [inicio horaInicio, fim horaFim), so a whole day ends at 00:00 of
// the next day.
//
// Admin only. Resolves the page filters in America/Sao_Paulo and returns the
// report of the main system (contract in the dashboard-api skill, "API de
// Custos da Julia"), normalized to the version 2 cost accounting.
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

      const raw = await fetchApi<RawJuliaModelUsageReport>(
        `${API_PATH}?${query}`,
      );

      return Response.json(
        { data: normalizeUsageReport(raw) },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    },
    { minimumRole: "ADMIN" },
  ),
);
