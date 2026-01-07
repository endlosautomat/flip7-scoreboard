export type Theme = {
  name: string;
  colors: {
    bg: string;        // App Hintergrund
    surface: string;   // Cards/Sections
    surface2: string;  // Inputs/Row chips
    text: string;      // Haupttext
    muted: string;     // Secondary text
    border: string;    // Ringe/Borders
    primary: string;   // Primary buttons
    primaryHover: string;
    accent: string;    // Winner highlight
    accentSoft: string;
    danger: string;    // Delete
    dangerHover: string;
  };
};



export const modernDarkBlue: Theme = {
  name: "modern-dark-blue",
  colors: {
    bg: "#070a12",
    surface: "#0b1220",
    surface2: "#0f1a2f",
    text: "#fafafa",
    muted: "#a1a1aa",
    border: "#1f2937",
    primary: "#0d3d1fff",
    primaryHover: "#0d3d1fff",
    accent: "#60a5fa",
    accentSoft: "rgba(96,165,250,0.14)",
    danger: "#ef4444",
    dangerHover: "#f87171",
  },
};


export const modernDark: Theme = {
  name: "modern-dark",
  colors: {
    bg: "#09090b",         // zinc-950-ish
    surface: "#0f172a",    // slate-ish (leicht blau)
    surface2: "#111827",   // dunkler Input
    text: "#fafafa",
    muted: "#a1a1aa",      // zinc-400-ish
    border: "#27272a",     // zinc-800-ish
    primary: "#14b8a6",    // teal-500
    primaryHover: "#2dd4bf",
    accent: "#f59e0b",     // amber-500 (für Winner)
    accentSoft: "rgba(245, 158, 11, 0.12)",
    danger: "#ef4444",     // red-500
    dangerHover: "#f87171",
  },
};

