// Canonical team values, as returned by the external API (SISTEMA_CFN_URL).
export const TEAMS = ["SIENA", "YORK"] as const;

export type Team = (typeof TEAMS)[number];
export type TeamValue = Team | "ALL" | "NONE";

// Never derive a label from the value (`capitalize`, `charAt(0).toUpperCase()`).
// The API values are uppercase, so those techniques only touch the first letter
// and would render "SIENA" instead of "Siena".
const TEAM_LABELS: Record<TeamValue, string> = {
  SIENA: "Siena",
  YORK: "York",
  ALL: "Todos",
  NONE: "Nenhum",
};

export function teamLabel(team: string | null | undefined): string {
  if (!team) return "--";
  return TEAM_LABELS[team as TeamValue] ?? team;
}

export const TEAM_EMOJIS: Record<string, string> = {
  SIENA: "🛡️",
  YORK: "🪞",
};

export const TEAM_COLORS: Record<string, string> = {
  SIENA: "#c8963e",
  YORK: "#3B82F6",
};
