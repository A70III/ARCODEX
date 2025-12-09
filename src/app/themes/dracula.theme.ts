import { Theme } from './theme.interface';

export const draculaTheme: Theme = {
  id: 'dracula',
  name: 'แดร็กคูล่า',
  nameEn: 'Dracula',
  colors: {
    // Background colors
    bgPrimary: '#282a36',
    bgSecondary: '#44475a',
    bgTertiary: '#4e5269',
    bgHover: '#6272a4',
    bgActive: '#bd93f9',
    
    // Border colors
    borderColor: '#44475a',
    borderLight: '#6272a4',
    
    // Text colors
    textPrimary: '#f8f8f2',
    textSecondary: '#e0e0e0',
    textMuted: '#6272a4',
    textInverse: '#282a36',
    
    // Accent colors - Dracula Purple
    accent: '#bd93f9',
    accentHover: '#a87df7',
    accentLight: '#44475a',
    
    // Semantic colors - Dracula palette
    success: '#50fa7b',
    warning: '#f1fa8c',
    error: '#ff5555',
    info: '#8be9fd',
    
    // Editor specific
    editorBg: '#282a36',
    lineNumberColor: '#6272a4',
    lineNumberBorder: '#44475a',
  }
};
