export const TEAL = "#2dd4bf";
export const CYAN = "#06b6d4";
export const AMBER = "#f59e0b";
export const ROSE = "#f43f5e";
export const SLATE = "#94a3b8";
export const VIOLET = "#8b5cf6";
export const GRN = "#4ade80";
export const ORANGE = "#fb923c";
export const PINK = "#ec4899";

export const COLOR_POOL = [
  ROSE,
  "#f97316",
  "#eab308",
  "#22c55e",
  CYAN,
  VIOLET,
  PINK,
  "#14b8a6",
  "#84cc16",
  "#60a5fa",
  "#a78bfa",
  "#fb7185",
];

export function scoreColor(n: number | null): string {
  if (n === null) return SLATE;
  if (n >= 95) return TEAL;
  if (n >= 90) return CYAN;
  if (n >= 85) return GRN;
  if (n >= 75) return AMBER;
  return ROSE;
}

export const ISSUE_COLOR: Record<string, string> = {
  高: ROSE,
  中: AMBER,
  低: CYAN,
};
