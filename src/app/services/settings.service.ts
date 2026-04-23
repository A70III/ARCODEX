import { Injectable, signal, computed, effect } from '@angular/core';
import { Theme, ALL_THEMES, getThemeById, applyThemeToDocument, darkTheme } from '../themes';

export type ThemeType = 'dark' | 'light' | 'nord' | 'dracula' | 'dim';

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

const STORAGE_KEY = 'arcodex-settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // Dialog state
  readonly dialogOpen = signal<boolean>(false);
  
  // Settings state
  private _settings = signal<AppSettings>(this.loadSettings());
  readonly settings = this._settings.asReadonly();
  
  // Auto-save timer
  private autoSaveTimer: number | null = null;
  private autoSaveCallback: (() => void) | null = null;
  
  // Theme list from theme files
  readonly themes: Theme[] = ALL_THEMES;
  
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
  readonly showLineNumbers = computed(() => this._settings().showLineNumbers);
  readonly currentTheme = computed(() => {
    const themeId = this._settings().theme;
    return getThemeById(themeId) || darkTheme;
  });
  
  constructor() {
    // Auto-save settings on change
    effect(() => {
      const settings = this._settings();
      this.saveSettings(settings);
    });
    
    // Initialize theme on construction
    this.applyTheme(this._settings().theme);
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
  
  setTheme(themeId: ThemeType): void {
    this.updateSettings({ theme: themeId });
    this.applyTheme(themeId);
  }
  
  setFont(font: string): void {
    this.updateSettings({ editorFont: font });
  }
  
  setFontSize(size: number): void {
    this.updateSettings({ editorFontSize: Math.min(32, Math.max(12, size)) });
  }
  
  setAutoSaveInterval(seconds: number): void {
    this.updateSettings({ autoSaveInterval: Math.max(0, seconds) });
    this.restartAutoSave();
  }
  
  setShowLineNumbers(show: boolean): void {
    this.updateSettings({ showLineNumbers: show });
  }
  
  // Auto-save management
  registerAutoSaveCallback(callback: () => void): void {
    this.autoSaveCallback = callback;
    this.restartAutoSave();
  }
  
  unregisterAutoSaveCallback(): void {
    this.autoSaveCallback = null;
    this.stopAutoSave();
  }
  
  private restartAutoSave(): void {
    this.stopAutoSave();
    
    const interval = this._settings().autoSaveInterval;
    if (interval > 0 && this.autoSaveCallback) {
      this.autoSaveTimer = window.setInterval(() => {
        console.log('[Auto-save] Saving...');
        this.autoSaveCallback?.();
      }, interval * 1000);
      console.log(`[Auto-save] Enabled: every ${interval} seconds`);
    }
  }
  
  private stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      window.clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('[Auto-save] Disabled');
    }
  }
  
  // Theme application using the new theme system
  private applyTheme(themeId: ThemeType): void {
    const theme = getThemeById(themeId);
    if (theme) {
      applyThemeToDocument(theme);
    }
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
  
  // Initialize theme on app start (call from app component)
  initializeTheme(): void {
    this.applyTheme(this._settings().theme);
  }
}
