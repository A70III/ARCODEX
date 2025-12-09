import { Injectable, inject, signal, computed } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { ProjectStateService } from './project-state.service';

export interface ChapterItem {
  name: string;
  path: string;
  order: number;
  groupId: string | null;
  createdAt?: number;
}

export interface ChapterGroup {
  id: string;
  name: string;
  order: number;
  expanded: boolean;
}

// cOrder.taleside file structure
interface ChapterOrderConfig {
  version: string;
  chaptersOrder: ChapterItem[];
  chapterGroups: ChapterGroup[];
}

@Injectable({
  providedIn: 'root'
})
export class ChaptersService {
  private projectState = inject(ProjectStateService);

  // State signals
  private _chapters = signal<ChapterItem[]>([]);
  private _groups = signal<ChapterGroup[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _configValid = signal(false);

  // Public readonly signals
  readonly chapters = this._chapters.asReadonly();
  readonly groups = this._groups.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly configValid = this._configValid.asReadonly();

  // Computed: chapters without a group
  readonly ungroupedChapters = computed(() => 
    this._chapters().filter(c => !c.groupId).sort((a, b) => a.order - b.order)
  );

  // Computed: chapters grouped
  readonly groupedChapters = computed(() => {
    const groups = this._groups();
    const chapters = this._chapters();
    
    return groups.map(group => ({
      ...group,
      chapters: chapters
        .filter(c => c.groupId === group.id)
        .sort((a, b) => a.order - b.order)
    })).sort((a, b) => a.order - b.order);
  });

  // Get main config file path (for validation only)
  private getConfigPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/config.taleside`;
  }

  // Get chapters folder path
  private getChaptersFolderPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/chapters`;
  }

  // Get cOrder.taleside file path (in chapters folder)
  private getOrderFilePath(): string | null {
    const chaptersPath = this.getChaptersFolderPath();
    if (!chaptersPath) return null;
    return `${chaptersPath}/cOrder.taleside`;
  }

  // Validate config.taleside exists and has valid format
  async validateConfig(): Promise<boolean> {
    const configPath = this.getConfigPath();
    if (!configPath) {
      this._configValid.set(false);
      this._error.set('No project opened');
      return false;
    }

    try {
      const content = await invoke<string>('read_file_content', { path: configPath });
      const config = JSON.parse(content);
      
      // Check required fields
      if (!config.version || !config.title) {
        this._configValid.set(false);
        this._error.set('Invalid config.taleside format');
        return false;
      }

      this._configValid.set(true);
      this._error.set(null);
      return true;
    } catch (e) {
      this._configValid.set(false);
      this._error.set('config.taleside not found or invalid');
      return false;
    }
  }

  // Load chapters from folder and cOrder.taleside
  async loadChapters(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // First validate config
      const isValid = await this.validateConfig();
      if (!isValid) {
        this._loading.set(false);
        return;
      }

      const chaptersPath = this.getChaptersFolderPath();
      const orderFilePath = this.getOrderFilePath();
      
      if (!chaptersPath || !orderFilePath) {
        this._loading.set(false);
        return;
      }

      // Read cOrder.taleside for ordering/grouping info
      let savedOrder: ChapterItem[] = [];
      let savedGroups: ChapterGroup[] = [];
      
      try {
        const orderContent = await invoke<string>('read_file_content', { path: orderFilePath });
        const orderConfig = JSON.parse(orderContent) as ChapterOrderConfig;
        savedOrder = orderConfig.chaptersOrder || [];
        savedGroups = orderConfig.chapterGroups || [];
      } catch (e) {
        // cOrder.taleside doesn't exist yet, use defaults
      }

      // Read chapters folder
      try {
        const tree = await invoke<{ children?: { name: string; path: string; is_dir: boolean }[] }>('read_project_dir', { path: chaptersPath });
        
        const mdFiles = (tree.children || [])
          .filter(child => !child.is_dir && child.name.endsWith('.md'))
          .map(child => {
            // Find saved order info
            const saved = savedOrder.find(s => s.path === child.path);
            return {
              name: child.name.replace(/\.md$/, ''),
              path: child.path,
              order: saved?.order ?? Date.now(),
              groupId: saved?.groupId ?? null,
              createdAt: saved?.createdAt
            };
          });

        // Sort by order
        mdFiles.sort((a, b) => a.order - b.order);

        this._chapters.set(mdFiles);
        this._groups.set(savedGroups);
        
      } catch (e) {
        // Chapters folder might not exist
        this._chapters.set([]);
        this._groups.set([]);
      }

    } catch (e) {
      this._error.set(`Failed to load chapters: ${e}`);
    } finally {
      this._loading.set(false);
    }
  }

  // Save chapters order and groups to cOrder.taleside
  async saveOrderConfig(): Promise<void> {
    const orderFilePath = this.getOrderFilePath();
    const chaptersPath = this.getChaptersFolderPath();
    if (!orderFilePath || !chaptersPath) return;

    try {
      // Ensure chapters folder exists
      try {
        await invoke('create_folder', { path: chaptersPath });
      } catch (e) {
        // Folder might already exist
      }

      // Create cOrder.taleside content
      const orderConfig: ChapterOrderConfig = {
        version: '1.0',
        chaptersOrder: this._chapters(),
        chapterGroups: this._groups()
      };

      const content = JSON.stringify(orderConfig, null, 2);
      await invoke('save_file_content', { path: orderFilePath, content });
    } catch (e) {
      console.error('Failed to save cOrder.taleside:', e);
    }
  }

  // Create a new chapter
  async createChapter(name: string): Promise<boolean> {
    const chaptersPath = this.getChaptersFolderPath();
    if (!chaptersPath) return false;

    try {
      // Ensure chapters folder exists
      try {
        await invoke('create_folder', { path: chaptersPath });
      } catch (e) {
        // Folder might already exist
      }

      // Add .md extension if not present
      let fileName = name.trim();
      if (!fileName.endsWith('.md')) {
        fileName += '.md';
      }

      const filePath = `${chaptersPath}/${fileName}`;
      
      // Create empty file
      await invoke('save_file_content', { path: filePath, content: '' });

      // Get current lowest order (to place new chapter at top)
      const chapters = this._chapters();
      const minOrder = chapters.length > 0 
        ? Math.min(...chapters.map(c => c.order)) - 1 
        : 0;

      // Add to list
      const newChapter: ChapterItem = {
        name: fileName.replace(/\.md$/, ''),
        path: filePath,
        order: minOrder,
        groupId: null,
        createdAt: Date.now()
      };

      this._chapters.update(list => [newChapter, ...list]);
      await this.saveOrderConfig();
      
      // Refresh file tree
      await this.projectState.refreshFileTree();

      return true;
    } catch (e) {
      console.error('Failed to create chapter:', e);
      return false;
    }
  }

  // Rename a chapter
  async renameChapter(path: string, newName: string): Promise<boolean> {
    try {
      let fileName = newName.trim();
      if (!fileName.endsWith('.md')) {
        fileName += '.md';
      }

      // Get directory from path
      const dir = path.substring(0, path.lastIndexOf('/'));
      const newPath = `${dir}/${fileName}`;

      await invoke('rename_item', { oldPath: path, newPath: newPath });

      // Update local state
      this._chapters.update(list => 
        list.map(c => c.path === path 
          ? { ...c, path: newPath, name: fileName.replace(/\.md$/, '') }
          : c
        )
      );

      await this.saveOrderConfig();
      await this.projectState.refreshFileTree();

      return true;
    } catch (e) {
      console.error('Failed to rename chapter:', e);
      return false;
    }
  }

  // Delete a chapter
  async deleteChapter(path: string): Promise<boolean> {
    try {
      await invoke('delete_file', { path });

      // Remove from local state
      this._chapters.update(list => list.filter(c => c.path !== path));
      await this.saveOrderConfig();
      await this.projectState.refreshFileTree();

      return true;
    } catch (e) {
      console.error('Failed to delete chapter:', e);
      return false;
    }
  }

  // Reorder chapters (update order values)
  async reorderChapters(orderedPaths: string[]): Promise<void> {
    this._chapters.update(list => {
      return list.map(chapter => {
        const newOrder = orderedPaths.indexOf(chapter.path);
        return { ...chapter, order: newOrder >= 0 ? newOrder : chapter.order };
      }).sort((a, b) => a.order - b.order);
    });
    
    await this.saveOrderConfig();
  }

  // Create a group from selected chapters
  async createGroup(chapterPaths: string[], groupName: string): Promise<void> {
    const groupId = `group_${Date.now()}`;
    
    // Get max group order
    const groups = this._groups();
    const maxGroupOrder = groups.length > 0 
      ? Math.max(...groups.map(g => g.order)) + 1 
      : 0;

    // Add new group
    const newGroup: ChapterGroup = {
      id: groupId,
      name: groupName,
      order: maxGroupOrder,
      expanded: true
    };

    this._groups.update(list => [...list, newGroup]);

    // Update chapters to belong to this group
    this._chapters.update(list => 
      list.map(c => chapterPaths.includes(c.path) 
        ? { ...c, groupId } 
        : c
      )
    );

    await this.saveOrderConfig();
  }

  // Rename a group
  async renameGroup(groupId: string, newName: string): Promise<void> {
    this._groups.update(list => 
      list.map(g => g.id === groupId ? { ...g, name: newName } : g)
    );
    await this.saveOrderConfig();
  }

  // Delete a group (keep chapters, just ungroup them)
  async deleteGroup(groupId: string): Promise<void> {
    // Ungroup all chapters in this group
    this._chapters.update(list => 
      list.map(c => c.groupId === groupId ? { ...c, groupId: null } : c)
    );
    
    // Remove group
    this._groups.update(list => list.filter(g => g.id !== groupId));
    
    await this.saveOrderConfig();
  }

  // Toggle group expanded state
  toggleGroupExpanded(groupId: string): void {
    this._groups.update(list => 
      list.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g)
    );
  }

  // Ungroup a single chapter
  async ungroupChapter(path: string): Promise<void> {
    this._chapters.update(list => 
      list.map(c => c.path === path ? { ...c, groupId: null } : c)
    );
    await this.saveOrderConfig();
  }

  // Move chapter to a group
  async moveToGroup(chapterPath: string, groupId: string | null): Promise<void> {
    this._chapters.update(list => 
      list.map(c => c.path === chapterPath ? { ...c, groupId } : c)
    );
    await this.saveOrderConfig();
  }

  // Open chapter in editor
  openChapter(path: string): void {
    this.projectState.openFile(path);
  }
}
