import type { Theme } from "./theme";

export function applyTheme(theme: Theme) {
  const r = document.documentElement;

  const set = (k: string, v: string) => r.style.setProperty(k, v);

  set("--bg", theme.colors.bg);
  set("--surface", theme.colors.surface);
  set("--surface2", theme.colors.surface2);
  set("--text", theme.colors.text);
  set("--muted", theme.colors.muted);
  set("--border", theme.colors.border);

  set("--primary", theme.colors.primary);
  set("--primary-hover", theme.colors.primaryHover);

  set("--accent", theme.colors.accent);
  set("--accent-soft", theme.colors.accentSoft);

  set("--danger", theme.colors.danger);
  set("--danger-hover", theme.colors.dangerHover);
}
