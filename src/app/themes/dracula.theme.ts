import { Theme } from "./theme.interface";

export const draculaTheme: Theme = {
  id: "dracula",
  name: "แดร็กคูล่า",
  nameEn: "Dracula",
  colors: {
    // Background colors
    bgPrimary: "#242830",
    bgSecondary: "#3a3d4a",
    bgTertiary: "#4e5269",
    bgHover: "#6272a4",
    bgActive: "#a78bfa",

    // Border colors
    borderColor: "#3a3d4a",
    borderLight: "#6272a4",

    // Text colors
    textPrimary: "#e0e6f0",
    textSecondary: "#b8c0c8",
    textMuted: "#6272a4",
    textInverse: "#242830",

    // Accent colors - Muted Dracula Purple
    accent: "#a78bfa",
    accentHover: "#9b7bf0",
    accentLight: "#3a3d4a",

    // Semantic colors - Muted palette
    success: "#56d364",
    warning: "#e3b341",
    error: "#f85149",
    info: "#58a6ff",

    // Editor specific
    editorBg: "#242830",
    lineNumberColor: "#6272a4",
    lineNumberBorder: "#3a3d4a",
  },
};
