import { Theme } from './theme.interface';

export const dimTheme: Theme = {
  id: 'dim',
  name: 'สลัว',
  nameEn: 'Dim',
  colors: {
    // Background colors - Muted slate
    bgPrimary: '#22272e',
    bgSecondary: '#2d333b',
    bgTertiary: '#373e47',
    bgHover: '#444c56',
    bgActive: '#373e47',
    
    // Border colors
    borderColor: '#444c56',
    borderLight: '#545d68',
    
    // Text colors - Relaxed White
    textPrimary: '#adbac7',
    textSecondary: '#768390',
    textMuted: '#535a63',
    textInverse: '#1d232a',
    textActive: '#adbac7',
    
    // Accent colors - GitHub Dim Blue
    accent: '#539bf5',
    accentHover: '#72aeff',
    accentLight: '#264065',
    
    // Semantic colors
    success: '#57ab5a',
    warning: '#c69026',
    error: '#e5534b',
    info: '#539bf5',
    
    // Editor specific
    editorBg: '#22272e',
    lineNumberColor: '#535a63',
    lineNumberBorder: '#444c56',
  }
};
