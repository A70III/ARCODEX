import { Theme } from './theme.interface';

export const nordTheme: Theme = {
  id: 'nord',
  name: 'นอร์ด',
  nameEn: 'Nord',
  colors: {
    // Background colors - Nord Polar Night (Refined)
    bgPrimary: '#2e3440',
    bgSecondary: '#3b4252',
    bgTertiary: '#434c5e',
    bgHover: '#4c566a',
    bgActive: '#5e81ac',
    
    // Border colors
    borderColor: '#434c5e',
    borderLight: '#4c566a',
    
    // Text colors - Nord Snow Storm
    textPrimary: '#eceff4',
    textSecondary: '#d8dee9',
    textMuted: '#949aab',
    textInverse: '#2e3440',
    textActive: '#eceff4',
    
    // Accent colors - Nord Frost
    accent: '#88c0d0',
    accentHover: '#81a1c1',
    accentLight: '#3b4252',
    
    // Semantic colors - Nord Aurora
    success: '#a3be8c',
    warning: '#ebcb8b',
    error: '#bf616a',
    info: '#81a1c1',
    
    // Editor specific
    editorBg: '#2e3440',
    lineNumberColor: '#64708d',
    lineNumberBorder: '#3b4252',
  }
};
