import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeType = 'dark' | 'light' | 'nord' | 'dracula' | 'solarized';

export interface AppSettings {
  // Page 1: Appearance
  theme: ThemeType;
  editorFont: string;
  editorFontSize: number; // in px
  
  // Page 2: Editor
  autoSaveInterval: number; // seconds, 0 = disabled
  showLineNumbers: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  editorFont: 'Georgia',
  editorFontSize: 16,
  autoSaveInterval: 0,
  showLineNumbers: false,
};

const STORAGE_KEY = 'tales-ide-settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // Dialog state
  readonly dialogOpen = signal<boolean>(false);
  
  // Settings state
  private _settings = signal<AppSettings>(this.loadSettings());
  readonly settings = this._settings.asReadonly();
  
  // Theme definitions
  readonly themes: { id: ThemeType; name: string; colors: { bg: string; bgSecondary: string; text: string; accent: string } }[] = [
    { id: 'dark', name: 'Dark', colors: { bg: '#1e1e1e', bgSecondary: '#252526', text: '#cccccc', accent: '#007acc' } },
    { id: 'light', name: 'Light', colors: { bg: '#ffffff', bgSecondary: '#f3f3f3', text: '#333333', accent: '#0066cc' } },
    { id: 'nord', name: 'Nord', colors: { bg: '#2e3440', bgSecondary: '#3b4252', text: '#eceff4', accent: '#88c0d0' } },
    { id: 'dracula', name: 'Dracula', colors: { bg: '#282a36', bgSecondary: '#44475a', text: '#f8f8f2', accent: '#bd93f9' } },
    { id: 'solarized', name: 'Solarized', colors: { bg: '#002b36', bgSecondary: '#073642', text: '#839496', accent: '#268bd2' } },
  ];
  
  // Available system fonts (common ones)
  readonly availableFonts: string[] = [
    'Georgia',
    'Inter',
    'TH Sarabun New',
    'Sarabun',
    'Times New Roman',
    'Arial',
    'Helvetica',
    'Angsana New',
    'Tahoma',
    'Verdana',
    'Courier New',
  ];
  
  // Computed editor styles
  readonly editorFontFamily = computed(() => this._settings().editorFont);
  readonly editorFontSize = computed(() => this._settings().editorFontSize);
  readonly currentTheme = computed(() => {
    const themeId = this._settings().theme;
    return this.themes.find(t => t.id === themeId) || this.themes[0];
  });
  
  constructor() {
    // Auto-save settings on change
    effect(() => {
      const settings = this._settings();
      this.saveSettings(settings);
    });
  }
  
  // Dialog controls
  openDialog(): void {
    this.dialogOpen.set(true);
  }
  
  closeDialog(): void {
    this.dialogOpen.set(false);
  }
  
  // Settings updates
  updateSettings(partial: Partial<AppSettings>): void {
    this._settings.update(current => ({ ...current, ...partial }));
  }
  
  setTheme(theme: ThemeType): void {
    this.updateSettings({ theme });
    this.applyTheme(theme);
  }
  
  setFont(font: string): void {
    this.updateSettings({ editorFont: font });
  }
  
  setFontSize(size: number): void {
    this.updateSettings({ editorFontSize: Math.min(32, Math.max(12, size)) });
  }
  
  setAutoSaveInterval(seconds: number): void {
    this.updateSettings({ autoSaveInterval: Math.max(0, seconds) });
  }
  
  setShowLineNumbers(show: boolean): void {
    this.updateSettings({ showLineNumbers: show });
  }
  
  // Theme application
  private applyTheme(themeId: ThemeType): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.colors.bg);
    root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
    root.style.setProperty('--text-primary', theme.colors.text);
    root.style.setProperty('--accent', theme.colors.accent);
  }
  
  // Persistence
  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  }
  
  private saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
  
  // Initialize theme on app start
  initializeTheme(): void {
    this.applyTheme(this._settings().theme);
  }
}
