/**
 * Theme Blueprint Interface
 * ทุก theme ต้อง implement interface นี้เพื่อความสอดคล้อง
 */

export interface ThemeColors {
  // Background colors
  bgPrimary: string;      // Main background (editor, welcome screen)
  bgSecondary: string;    // Sidebar, panels
  bgTertiary: string;     // Toolbar, tab bar
  bgHover: string;        // Hover state
  bgActive: string;       // Active/selected state
  
  // Border colors
  borderColor: string;    // Regular borders
  borderLight: string;    // Light/subtle borders
  
  // Text colors
  textPrimary: string;    // Main text
  textSecondary: string;  // Secondary/muted text
  textMuted: string;      // Very muted text (placeholders)
  textInverse: string;    // Text on accent backgrounds
  textActive: string;     // Text for active/selected items
  
  // Accent colors
  accent: string;         // Primary accent (buttons, links)
  accentHover: string;    // Accent hover state
  accentLight: string;    // Light accent (selected backgrounds)
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Editor specific
  editorBg: string;       // Editor content background
  lineNumberColor: string; // Line number text
  lineNumberBorder: string; // Line number gutter border
}

export interface Theme {
  id: string;
  name: string;
  nameEn: string;
  colors: ThemeColors;
}
