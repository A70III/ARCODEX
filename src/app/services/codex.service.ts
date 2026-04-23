import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { ProjectStateService } from './project-state.service';
import { CodexItem, CodexCategory } from '../models/codex.model';
export type { CodexItem, CodexCategory };

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
  private _items = signal<CodexItem[]>([]);
  
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
  readonly items = this._items.asReadonly();

  // Computed: submenu items with labels
  readonly submenuItems = computed(() => {
    const folders = this._folders();
    const customLabels = this._customLabels();
    
    return folders.map(folder => ({
      folder,
      label: customLabels[folder] || folder
    }));
  });

  // Computed: items for active tab
  readonly activeTabItems = computed(() => {
    const tab = this._activeTab();
    const allItems = this._items();
    
    if (tab === 'all') return allItems;
    return allItems.filter(item => {
      const itemFolder = this.getItemFolder(item.path);
      return itemFolder === tab;
    });
  });

  // Computed: categories with items
  readonly categories = computed((): CodexCategory[] => {
    const folders = this._folders();
    const customLabels = this._customLabels();
    const allItems = this._items();
    
    return folders.map(folder => ({
      folder,
      label: customLabels[folder] || folder,
      items: allItems.filter(item => this.getItemFolder(item.path) === folder)
    }));
  });

  // Get codex folder path
  private getCodexFolderPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/codex`;
  }

  // Get config.arc path
  private getConfigPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/config.arc`;
  }

  // Load codex folders and config
  async loadCodex(): Promise<void> {
    this._loading.set(true);

    try {
      // Load folders from /codex
      await this.loadCodexFolders();
      
      // Load custom labels from config.arc
      await this.loadSubmenuConfig();
      
      // Load project info
      await this.loadProjectInfo();
      
      // Load all items
      await this.loadItems();
      
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

  // Load custom submenu labels from config.arc
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

  // Load all items from all codex folders
  async loadItems(): Promise<void> {
    const codexPath = this.getCodexFolderPath();
    if (!codexPath) {
      this._items.set([]);
      return;
    }

    try {
      const folders = this._folders();
      const allItems: CodexItem[] = [];
      
      for (const folder of folders) {
        const folderPath = `${codexPath}/${folder}`;
        try {
          const tree = await invoke<{ children?: { name: string; path: string; is_dir: boolean }[] }>('read_project_dir', { path: folderPath });
          const files = (tree.children || []).filter(child => !child.is_dir);
          
          for (const file of files) {
            try {
              const content = await invoke<string>('read_file_content', { path: file.path });
              allItems.push({
                id: file.path,
                name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                path: file.path,
                content: content
              });
            } catch (e) {
              console.warn(`Failed to read file ${file.path}:`, e);
            }
          }
        } catch (e) {
          console.warn(`Failed to read folder ${folderPath}:`, e);
        }
      }
      
      this._items.set(allItems);
    } catch (e) {
      console.error('Failed to load items:', e);
      this._items.set([]);
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
    this._items.set([]);
  }

  // Set active tab
  setActiveTab(tab: string): void {
    this._activeTab.set(tab);
  }

  // Create a new category folder and update config.arc
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

      // Update config.arc with new submenu entry
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

  // Add submenu entry to config.arc
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
      console.error('Failed to update config.arc:', e);
    }
  }

  // Load project info from config.arc
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

  // Update project info in config.arc
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

  // Get items for active tab
  getActiveTabItems(): CodexItem[] {
    return this.activeTabItems();
  }

  // Helper: get folder from item path
  getItemFolder(itemPath: string): string {
    const codexPath = this.getCodexFolderPath();
    if (!codexPath) return '';
    const relative = itemPath.replace(codexPath + '/', '');
    const parts = relative.split('/');
    return parts.length > 1 ? parts[0] : '';
  }

  // Create new item in active folder
  async createItem(name: string, content: string): Promise<boolean> {
    const activeTab = this._activeTab();
    if (activeTab === 'all') return false;

    const codexPath = this.getCodexFolderPath();
    if (!codexPath) return false;

    try {
      const fileName = name.endsWith('.md') ? name : `${name}.md`;
      const filePath = `${codexPath}/${activeTab}/${fileName}`;
      
      await invoke('save_file_content', { path: filePath, content });
      
      // Reload items
      await this.loadItems();
      
      // Refresh file tree
      this.projectState.refreshFileTree();
      
      return true;
    } catch (e) {
      console.error('Failed to create item:', e);
      return false;
    }
  }

  // Delete item
  async deleteItem(item: CodexItem): Promise<boolean> {
    try {
      await invoke('delete_file', { path: item.path });
      
      // Reload items
      await this.loadItems();
      
      // Refresh file tree
      this.projectState.refreshFileTree();
      
      return true;
    } catch (e) {
      console.error('Failed to delete item:', e);
      return false;
    }
  }

  // Rename item
  async renameItem(item: CodexItem, newName: string): Promise<boolean> {
    try {
      const newFileName = newName.endsWith('.md') ? newName : `${newName}.md`;
      const pathParts = item.path.split('/');
      pathParts[pathParts.length - 1] = newFileName;
      const newPath = pathParts.join('/');
      
      await invoke('rename_item', { oldPath: item.path, newPath });
      
      // Reload items
      await this.loadItems();
      
      // Refresh file tree
      this.projectState.refreshFileTree();
      
      return true;
    } catch (e) {
      console.error('Failed to rename item:', e);
      return false;
    }
  }
}

