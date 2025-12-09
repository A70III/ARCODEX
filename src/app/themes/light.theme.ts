import { Theme } from './theme.interface';

export const lightTheme: Theme = {
  id: 'light',
  name: 'สว่าง',
  nameEn: 'Light',
  colors: {
    // Background colors
    bgPrimary: '#ffffff',
    bgSecondary: '#f3f3f3',
    bgTertiary: '#e8e8e8',
    bgHover: '#d4d4d4',
    bgActive: '#cce5ff',
    
    // Border colors
    borderColor: '#e0e0e0',
    borderLight: '#f0f0f0',
    
    // Text colors
    textPrimary: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    textInverse: '#ffffff',
    
    // Accent colors
    accent: '#0066cc',
    accentHover: '#004999',
    accentLight: '#e6f2ff',
    
    // Semantic colors
    success: '#388e3c',
    warning: '#f57c00',
    error: '#d32f2f',
    info: '#1976d2',
    
    // Editor specific
    editorBg: '#ffffff',
    lineNumberColor: '#999999',
    lineNumberBorder: '#e0e0e0',
  }
};
