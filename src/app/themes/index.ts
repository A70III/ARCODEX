/**
 * Theme Index
 * Export ทุก themes และ utilities สำหรับใช้งาน
 */

export type { Theme, ThemeColors } from './theme.interface';
export { darkTheme } from './dark.theme';
export { lightTheme } from './light.theme';
export { nordTheme } from './nord.theme';
export { draculaTheme } from './dracula.theme';
export { dimTheme } from './dim.theme';

import { Theme } from './theme.interface';
import { darkTheme } from './dark.theme';
import { lightTheme } from './light.theme';
import { nordTheme } from './nord.theme';
import { draculaTheme } from './dracula.theme';
import { dimTheme } from './dim.theme';

// รายการ themes ทั้งหมด
export const ALL_THEMES: Theme[] = [
  darkTheme,
  lightTheme,
  nordTheme,
  draculaTheme,
  dimTheme,
];

// Helper: หา theme ตาม id
export function getThemeById(id: string): Theme | undefined {
  return ALL_THEMES.find(t => t.id === id);
}

// Helper: Apply theme to document root as CSS variables
export function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;
  
  // Apply all CSS variables
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--bg-active', colors.bgActive);
  
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--border-light', colors.borderLight);
  
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--text-inverse', colors.textInverse);
  
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-hover', colors.accentHover);
  root.style.setProperty('--accent-light', colors.accentLight);
  
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--error', colors.error);
  root.style.setProperty('--info', colors.info);
  
  root.style.setProperty('--editor-bg', colors.editorBg);
  root.style.setProperty('--line-number-color', colors.lineNumberColor);
  root.style.setProperty('--line-number-border', colors.lineNumberBorder);
  
  // Also set data-theme for daisyUI compatibility
  root.setAttribute('data-theme', theme.id);
  
  console.log(`[Theme] Applied: ${theme.nameEn} (${theme.id})`);
}
