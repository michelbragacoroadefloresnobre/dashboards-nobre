// Canonical ids of the Julia agents, as returned by the main system
// (SISTEMA_CFN_URL, GET /api/v1/dashboard/julia/model-usage). The order is the
// canonical one used by the API (`byAgent`) and by every list on the page.
export const JULIA_AGENTS = [
  "julia_turn",
  "julia_followup",
  "julia_local",
  "julia_media",
] as const;

export type JuliaAgent = (typeof JULIA_AGENTS)[number];

export function isJuliaAgent(value: string): value is JuliaAgent {
  return (JULIA_AGENTS as readonly string[]).includes(value);
}

// Never derive a label from the id: the ids are snake_case and would render
// "julia_turn" instead of "Julia (turno)".
export const JULIA_AGENT_LABELS: Record<JuliaAgent, string> = {
  julia_turn: "Julia (turno)",
  julia_followup: "Follow-up",
  julia_local: "Agente de local",
  julia_media: "Análise de mídia",
};

export const JULIA_AGENT_DESCRIPTIONS: Record<JuliaAgent, string> = {
  julia_turn: "Turno de atendimento no WhatsApp, em venda e pós-venda",
  julia_followup: "Decisão de re-engajamento depois do silêncio do cliente",
  julia_local: "Resolução do local do velório com grounding no Google Maps",
  julia_media: "Transcrição de áudio e leitura de imagem e PDF",
};

// Colors are fixed per agent identity (never by ranking) and were validated
// for color blindness. The hex values live in `globals.css` (@theme tokens
// `--color-julia-*`) so Tailwind classes and chart strokes share one source.
export const JULIA_AGENT_COLORS: Record<JuliaAgent, string> = {
  julia_turn: "var(--color-julia-turn)",
  julia_followup: "var(--color-julia-followup)",
  julia_local: "var(--color-julia-local)",
  julia_media: "var(--color-julia-media)",
};

export const JULIA_AGENT_SWATCH_CLASS: Record<JuliaAgent, string> = {
  julia_turn: "bg-julia-turn",
  julia_followup: "bg-julia-followup",
  julia_local: "bg-julia-local",
  julia_media: "bg-julia-media",
};

export function juliaAgentLabel(agent: string): string {
  return isJuliaAgent(agent) ? JULIA_AGENT_LABELS[agent] : agent;
}

const JULIA_TASK_LABELS: Record<string, string> = {
  active: "Venda",
  post_sale: "Pós-venda",
  decision: "Decisão",
  grounding: "Grounding no Maps",
  audio: "Áudio",
  image: "Imagem",
  document: "PDF",
};

export function juliaTaskLabel(task: string | null): string {
  if (!task) return "Sem tarefa";
  return JULIA_TASK_LABELS[task] ?? task;
}

const MODEL_CALL_ERROR_LABELS: Record<string, string> = {
  timeout: "Timeout",
  rate_limit: "Limite de requisições (429)",
  auth: "Autenticação",
  bad_request: "Requisição inválida (4xx)",
  provider_error: "Erro do provedor (5xx)",
  network: "Rede",
  unknown: "Desconhecido",
};

export function modelCallErrorLabel(kind: string): string {
  return MODEL_CALL_ERROR_LABELS[kind] ?? kind;
}
