import { Theme } from './theme.interface';

export const dimTheme: Theme = {
  id: 'dim',
  name: 'สลัว',
  nameEn: 'Dim',
  colors: {
    // Background colors - Muted dark
    bgPrimary: '#1d232a',
    bgSecondary: '#242b33',
    bgTertiary: '#2a323c',
    bgHover: '#3b4654',
    bgActive: '#4b5c6b',
    
    // Border colors
    borderColor: '#3b4654',
    borderLight: '#4b5c6b',
    
    // Text colors - Softer whites
    textPrimary: '#b8c0c8',
    textSecondary: '#8b949e',
    textMuted: '#6b737d',
    textInverse: '#1d232a',
    
    // Accent colors - GitHub-like blue
    accent: '#58a6ff',
    accentHover: '#79b8ff',
    accentLight: '#264f78',
    
    // Semantic colors
    success: '#56d364',
    warning: '#e3b341',
    error: '#f85149',
    info: '#58a6ff',
    
    // Editor specific
    editorBg: '#1d232a',
    lineNumberColor: '#6b737d',
    lineNumberBorder: '#3b4654',
  }
};
