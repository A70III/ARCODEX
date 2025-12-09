import { Theme } from './theme.interface';

export const darkTheme: Theme = {
  id: 'dark',
  name: 'มืด',
  nameEn: 'Dark',
  colors: {
    // Background colors - Warmer Dark Grey
    bgPrimary: '#212224',
    bgSecondary: '#282a2d',
    bgTertiary: '#2f3235',
    bgHover: '#383b40',
    bgActive: '#094771',
    
    // Border colors
    borderColor: '#383b40',
    borderLight: '#45484d',
    
    // Text colors - Soft White
    textPrimary: '#d4d4d4',
    textSecondary: '#a0a0a0',
    textMuted: '#707070',
    textInverse: '#ffffff',
    textActive: '#ffffff',
    
    // Accent colors - Muted Blue
    accent: '#2d8cf0',
    accentHover: '#4da3f7',
    accentLight: '#183b59',
    
    // Semantic colors
    success: '#81c784',
    warning: '#ffb74d',
    error: '#e57373',
    info: '#64b5f6',
    
    // Editor specific
    editorBg: '#212224',
    lineNumberColor: '#707070',
    lineNumberBorder: '#383b40',
  }
};
