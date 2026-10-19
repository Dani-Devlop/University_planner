// WEEKLY//UNI — accent color helpers
//
// Class/exam colors are bright neons tuned for the dark theme. On the light
// theme those neons are unreadable as text, so we swap to darker same-hue
// variants. Alpha tints (e.g. `${hex}14`) stay identical on both themes.

/** Known palette → light-theme readable equivalents */
const LIGHT_MAP: Record<string, string> = {
  "#00ff41": "#0a8f30", // terminal green
  "#34d399": "#047857", // emerald
  "#22d3ee": "#0e7490", // cyan
  "#c084fc": "#9333ea", // purple
  "#fbbf24": "#b45309", // amber
  "#fb7185": "#e11d48", // rose
};

/** Generic fallback: darken any hex for light backgrounds */
function darkenHex(hex: string, factor: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 0xff) * factor);
  const g = Math.round(((n >> 8) & 0xff) * factor);
  const b = Math.round((n & 0xff) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Text/solid accent for the current theme.
 * `theme`: "dark" | "light" (from next-themes resolvedTheme, "dark" fallback)
 */
export function accentFor(hex: string, theme: string | undefined): string {
  if (theme === "light") {
    const mapped = LIGHT_MAP[hex.trim().toLowerCase()];
    if (mapped) return mapped;
    return darkenHex(hex, 0.55);
  }
  return hex;
}
