import { Theme } from './theme.interface';

export const lightTheme: Theme = {
  id: 'light',
  name: 'สว่าง',
  nameEn: 'Light',
  colors: {
    // Background colors - Notion Style
    bgPrimary: '#ffffff',
    bgSecondary: '#fbfbfa',
    bgTertiary: '#f7f7f5',
    bgHover: '#efeff5',
    bgActive: '#eaeef5',
    
    // Border colors
    borderColor: '#e9e9e7',
    borderLight: '#f0f0f0',
    
    // Text colors - Notion Dark Grey
    textPrimary: '#37352f',
    textSecondary: '#787774',
    textMuted: '#9b9a97',
    textInverse: '#ffffff',
    textActive: '#2383e2',
    
    // Accent colors - Notion Blue
    accent: '#2383e2',
    accentHover: '#1d70c2',
    accentLight: '#e3f2fd',
    
    // Semantic colors
    success: '#0f7b6c',
    warning: '#dfab01',
    error: '#eb5757',
    info: '#2383e2',
    
    // Editor specific
    editorBg: '#ffffff',
    lineNumberColor: '#9b9a97',
    lineNumberBorder: '#e9e9e7',
  }
};
