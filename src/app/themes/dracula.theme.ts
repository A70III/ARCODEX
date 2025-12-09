import { Theme } from "./theme.interface";

export const draculaTheme: Theme = {
  id: "dracula",
  name: "แดร็กคูล่า",
  nameEn: "Dracula",
  colors: {
    // Background colors - Softer Dracula
    bgPrimary: '#282a36',
    bgSecondary: '#343746',
    bgTertiary: '#44475a',
    bgHover: '#6272a4',
    bgActive: '#44475a',

    // Border colors
    borderColor: '#44475a',
    borderLight: '#6272a4',

    // Text colors
    textPrimary: '#f8f8f2',
    textSecondary: '#bfbfbf',
    textMuted: '#6272a4',
    textInverse: '#282a36',
    textActive: '#f8f8f2',

    // Accent colors - Muted Purple
    accent: '#bd93f9',
    accentHover: '#caa9fa',
    accentLight: '#44475a',

    // Semantic colors
    success: '#50fa7b',
    warning: '#ffb86c',
    error: '#ff5555',
    info: '#8be9fd',

    // Editor specific
    editorBg: '#282a36',
    lineNumberColor: '#6272a4',
    lineNumberBorder: '#44475a',
  },
};
