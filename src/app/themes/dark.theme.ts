import { Theme } from './theme.interface';

export const darkTheme: Theme = {
  id: 'dark',
  name: 'มืด',
  nameEn: 'Dark',
  colors: {
    // Background colors
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    bgHover: '#3c3c3c',
    bgActive: '#094771',
    
    // Border colors
    borderColor: '#3c3c3c',
    borderLight: '#454545',
    
    // Text colors
    textPrimary: '#cccccc',
    textSecondary: '#969696',
    textMuted: '#6e6e6e',
    textInverse: '#ffffff',
    
    // Accent colors
    accent: '#007acc',
    accentHover: '#1c8ad4',
    accentLight: '#094771',
    
    // Semantic colors
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Editor specific
    editorBg: '#1e1e1e',
    lineNumberColor: '#6e6e6e',
    lineNumberBorder: '#3c3c3c',
  }
};
