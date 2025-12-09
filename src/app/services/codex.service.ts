import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { ProjectStateService } from './project-state.service';

export interface CodexSubmenuItem {
  folder: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class CodexService {
  private projectState = inject(ProjectStateService);

  constructor() {
    // Auto-reset when project is closed
    effect(() => {
      const path = this.projectState.currentFolderPath();
      if (!path) {
        this.reset();
      }
    });
  }

  // State signals
  private _folders = signal<string[]>([]);
  private _customLabels = signal<Record<string, string>>({});
  private _loading = signal(false);
  private _activeTab = signal<string>('all');
  
  // Project info signals
  private _projectTitle = signal<string>('');
  private _projectAuthor = signal<string>('');
  private _projectGenre = signal<string>('');

  // Public readonly signals
  readonly folders = this._folders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();
  readonly projectTitle = this._projectTitle.asReadonly();
  readonly projectAuthor = this._projectAuthor.asReadonly();
  readonly projectGenre = this._projectGenre.asReadonly();

  // Computed: submenu items with labels
  readonly submenuItems = computed(() => {
    const folders = this._folders();
    const customLabels = this._customLabels();
    
    return folders.map(folder => ({
      folder,
      label: customLabels[folder] || folder
    }));
  });

  // Get codex folder path
  private getCodexFolderPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/codex`;
  }

  // Get config.taleside path
  private getConfigPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/config.taleside`;
  }

  // Load codex folders and config
  async loadCodex(): Promise<void> {
    this._loading.set(true);

    try {
      // Load folders from /codex
      await this.loadCodexFolders();
      
      // Load custom labels from config.taleside
      await this.loadSubmenuConfig();
      
      // Load project info
      await this.loadProjectInfo();
      
    } catch (e) {
      console.error('Failed to load codex:', e);
    } finally {
      this._loading.set(false);
    }
  }

  // Load folder names from codex directory
  private async loadCodexFolders(): Promise<void> {
    const codexPath = this.getCodexFolderPath();
    if (!codexPath) return;

    try {
      // Ensure codex folder exists
      try {
        await invoke('create_folder', { path: codexPath });
      } catch (e) {
        // Folder might already exist
      }

      const tree = await invoke<{ children?: { name: string; path: string; is_dir: boolean }[] }>('read_project_dir', { path: codexPath });
      
      const folders = (tree.children || [])
        .filter(child => child.is_dir)
        .map(child => child.name);

      this._folders.set(folders);
    } catch (e) {
      console.error('Failed to load codex folders:', e);
      this._folders.set([]);
    }
  }

  // Load custom submenu labels from config.taleside
  private async loadSubmenuConfig(): Promise<void> {
    const configPath = this.getConfigPath();
    if (!configPath) return;

    try {
      const content = await invoke<string>('read_file_content', { path: configPath });
      const config = JSON.parse(content);
      
      // Parse submenu array: [{ "characters": "ตัวละคร" }, { "powers": "พลัง" }]
      const submenu = config.submenu || [];
      const labels: Record<string, string> = {};
      
      for (const item of submenu) {
        // Each item is an object with one key-value pair
        const keys = Object.keys(item);
        if (keys.length > 0) {
          const folder = keys[0];
          labels[folder] = item[folder];
        }
      }

      this._customLabels.set(labels);
    } catch (e) {
      console.error('Failed to load submenu config:', e);
      this._customLabels.set({});
    }
  }

  // Reset all state (called when project is closed)
  reset(): void {
    this._folders.set([]);
    this._customLabels.set({});
    this._activeTab.set('all');
    this._projectTitle.set('');
    this._projectAuthor.set('');
    this._projectGenre.set('');
    this._loading.set(false);
  }

  // Set active tab
  setActiveTab(tab: string): void {
    this._activeTab.set(tab);
  }

  // Create a new category folder and update config.taleside
  async createCategory(folderName: string, displayName: string): Promise<boolean> {
    const codexPath = this.getCodexFolderPath();
    const configPath = this.getConfigPath();
    
    if (!codexPath || !configPath) return false;

    try {
      // Create folder in codex/
      const newFolderPath = `${codexPath}/${folderName}`;
      await invoke('create_folder', { path: newFolderPath });

      // Refresh file tree in the background
      this.projectState.refreshFileTree();

      // Update config.taleside with new submenu entry
      await this.addSubmenuEntry(folderName, displayName);

      // Reload codex to reflect changes
      await this.loadCodex();

      // Switch to the new tab
      this.setActiveTab(folderName);

      return true;
    } catch (e) {
      console.error('Failed to create category:', e);
      return false;
    }
  }

  // Add submenu entry to config.taleside
  private async addSubmenuEntry(folderName: string, displayName: string): Promise<void> {
    const configPath = this.getConfigPath();
    if (!configPath) return;

    try {
      // Read existing config
      const content = await invoke<string>('read_file_content', { path: configPath });
      const config = JSON.parse(content);

      // Initialize submenu array if not exists
      if (!config.submenu) {
        config.submenu = [];
      }

      // Check if entry already exists
      const existing = config.submenu.find((item: any) => {
        const keys = Object.keys(item);
        return keys.length > 0 && keys[0] === folderName;
      });

      if (!existing) {
        // Add new entry
        config.submenu.push({ [folderName]: displayName });
      }

      // Save updated config
      const newContent = JSON.stringify(config, null, 2);
      await invoke('save_file_content', { path: configPath, content: newContent });
    } catch (e) {
      console.error('Failed to update config.taleside:', e);
    }
  }

  // Load project info from config.taleside
  private async loadProjectInfo(): Promise<void> {
    const configPath = this.getConfigPath();
    if (!configPath) return;

    try {
      const content = await invoke<string>('read_file_content', { path: configPath });
      const config = JSON.parse(content);
      
      this._projectTitle.set(config.title || '');
      this._projectAuthor.set(config.author || '');
      this._projectGenre.set(config.genre || '');
    } catch (e) {
      console.error('Failed to load project info:', e);
    }
  }

  // Update project info in config.taleside
  async updateProjectInfo(title: string, author: string, genre: string): Promise<boolean> {
    const configPath = this.getConfigPath();
    if (!configPath) return false;

    try {
      // Read existing config
      const content = await invoke<string>('read_file_content', { path: configPath });
      const config = JSON.parse(content);

      // Update fields
      config.title = title;
      config.author = author;
      config.genre = genre;

      // Save updated config
      const newContent = JSON.stringify(config, null, 2);
      await invoke('save_file_content', { path: configPath, content: newContent });

      // Update local state
      this._projectTitle.set(title);
      this._projectAuthor.set(author);
      this._projectGenre.set(genre);

      return true;
    } catch (e) {
      console.error('Failed to update project info:', e);
      return false;
    }
  }

  // Get genre label from value
  getGenreLabel(value: string): string {
    const genreMap: Record<string, string> = {
      'romance': 'โรแมนติก',
      'fantasy': 'แฟนตาซี',
      'wuxia': 'กำลังภายใน',
      'xianxia': 'เทพเซียน',
      'xuanhuan': 'เซวียนหวน',
      'litrpg': 'LitRPG',
      'action': 'แอคชั่น',
      'horror': 'สยองขวัญ',
      'drama': 'ดราม่า',
      'comedy': 'ตลก',
      'scifi': 'ไซไฟ',
      'historical': 'ย้อนยุค',
      'isekai': 'อิเซไก',
      'yaoi': 'วาย',
      'yuri': 'ยูริ',
      'mystery': 'สืบสวน',
      'slice_of_life': 'Slice of Life',
      'other': 'อื่นๆ'
    };
    return genreMap[value] || value;
  }

  // Get items for active tab (placeholder - will be expanded later)
  getActiveTabItems(): any[] {
    // TODO: Implement loading items from folder
    return [];
  }
}

