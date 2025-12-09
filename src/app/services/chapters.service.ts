import { Injectable, inject, signal, computed } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { ProjectStateService } from './project-state.service';

// Simplified chapter order item - only essential fields for cOrder.arc
export interface ChapterOrderItem {
  name: string;
  order: number;
  groupId: string | null;
}

// Full chapter item used internally (includes path)
export interface ChapterItem {
  name: string;
  path: string;
  order: number;
  groupId: string | null;
}

export interface ChapterGroup {
  id: string;
  name: string;
  order: number;
  expanded: boolean;
}

// cOrder.arc file structure
interface ChapterOrderConfig {
  version: string;
  chaptersOrder: ChapterOrderItem[];
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

  // Computed: chapters grouped - optimized with Map for O(n) grouping
  readonly groupedChapters = computed(() => {
    const groups = this._groups();
    const chapters = this._chapters();
    
    // Build Map for O(n) grouping instead of O(n*m) with filter
    const chaptersMap = new Map<string, ChapterItem[]>();
    for (const chapter of chapters) {
      if (!chapter.groupId) continue;
      if (!chaptersMap.has(chapter.groupId)) {
        chaptersMap.set(chapter.groupId, []);
      }
      chaptersMap.get(chapter.groupId)!.push(chapter);
    }
    
    // Map groups with pre-grouped chapters
    return groups
      .map(group => {
        const groupChapters = chaptersMap.get(group.id) || [];
        // Sort only once per group
        groupChapters.sort((a, b) => a.order - b.order);
        return { ...group, chapters: groupChapters };
      })
      .sort((a, b) => a.order - b.order);
  });

  // Get main config file path (for validation only)
  private getConfigPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/config.arc`;
  }

  // Get chapters folder path
  private getChaptersFolderPath(): string | null {
    const folderPath = this.projectState.currentFolderPath();
    if (!folderPath) return null;
    return `${folderPath}/chapters`;
  }

  // Get cOrder.arc file path (in chapters folder)
  private getOrderFilePath(): string | null {
    const chaptersPath = this.getChaptersFolderPath();
    if (!chaptersPath) return null;
    return `${chaptersPath}/cOrder.arc`;
  }

  // Validate config.arc exists and has valid format
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
        this._error.set('Invalid config.arc format');
        return false;
      }

      this._configValid.set(true);
      this._error.set(null);
      return true;
    } catch (e) {
      this._configValid.set(false);
      this._error.set('config.arc not found or invalid');
      return false;
    }
  }

  // Load chapters from folder and cOrder.arc
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

      // Read cOrder.arc for ordering/grouping info
      let savedOrder: ChapterOrderItem[] = [];
      let savedGroups: ChapterGroup[] = [];
      
      try {
        const orderContent = await invoke<string>('read_file_content', { path: orderFilePath });
        const orderConfig = JSON.parse(orderContent) as ChapterOrderConfig;
        savedOrder = orderConfig.chaptersOrder || [];
        savedGroups = orderConfig.chapterGroups || [];
      } catch (e) {
        // cOrder.arc doesn't exist yet, use defaults
      }

      // Read chapters folder
      try {
        const tree = await invoke<{ children?: { name: string; path: string; is_dir: boolean }[] }>('read_project_dir', { path: chaptersPath });
        
        const mdFiles = (tree.children || [])
          .filter(child => !child.is_dir && child.name.endsWith('.md'))
          .map(child => {
            const baseName = child.name.replace(/\.md$/, '');
            // Find saved order info by name
            const saved = savedOrder.find(s => s.name === baseName);
            return {
              name: baseName,
              path: child.path,
              order: saved?.order ?? 999, // Default high order for new chapters
              groupId: saved?.groupId ?? null,
            };
          });

        // Sort by order
        mdFiles.sort((a, b) => a.order - b.order);

        // Reassign sequential order numbers starting from 1
        mdFiles.forEach((file, index) => {
          file.order = index + 1;
        });

        this._chapters.set(mdFiles);
        this._groups.set(savedGroups);
        
        // Save to normalize order if needed
        if (mdFiles.length > 0) {
          await this.saveOrderConfig();
        }
        
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

  // Save chapters order and groups to cOrder.arc
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

      // Convert to simplified format (only name, order, groupId)
      const chaptersOrder: ChapterOrderItem[] = this._chapters().map(c => ({
        name: c.name,
        order: c.order,
        groupId: c.groupId
      }));

      // Create cOrder.arc content
      const orderConfig: ChapterOrderConfig = {
        version: '1.0',
        chaptersOrder,
        chapterGroups: this._groups()
      };

      const content = JSON.stringify(orderConfig, null, 2);
      await invoke('save_file_content', { path: orderFilePath, content });
    } catch (e) {
      console.error('Failed to save cOrder.arc:', e);
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
      const baseName = fileName.replace(/\.md$/, '');
      
      // Create empty file
      await invoke('save_file_content', { path: filePath, content: '' });

      // Shift all existing orders up by 1 and add new chapter at order 1
      const chapters = this._chapters();
      const updatedChapters = chapters.map(c => ({ ...c, order: c.order + 1 }));

      // Add new chapter at top (order 1)
      const newChapter: ChapterItem = {
        name: baseName,
        path: filePath,
        order: 1,
        groupId: null,
      };

      this._chapters.set([newChapter, ...updatedChapters]);
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
      const baseName = fileName.replace(/\.md$/, '');

      await invoke('rename_item', { oldPath: path, newPath: newPath });

      // Update local state
      this._chapters.update(list => 
        list.map(c => c.path === path 
          ? { ...c, path: newPath, name: baseName }
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

      // Remove from local state and reorder
      let chapters = this._chapters().filter(c => c.path !== path);
      
      // Reassign sequential orders
      chapters.sort((a, b) => a.order - b.order);
      chapters.forEach((c, i) => { c.order = i + 1; });
      
      this._chapters.set(chapters);
      await this.saveOrderConfig();
      await this.projectState.refreshFileTree();

      return true;
    } catch (e) {
      console.error('Failed to delete chapter:', e);
      return false;
    }
  }

  // Move chapter up (decrease order number, swap with previous)
  async moveChapterUp(path: string): Promise<void> {
    const chapters = [...this._chapters()];
    const index = chapters.findIndex(c => c.path === path);
    
    if (index <= 0) return; // Already at top or not found
    
    // Swap with previous
    const current = chapters[index];
    const previous = chapters[index - 1];
    
    current.order = index; // Previous position (1-indexed)
    previous.order = index + 1; // Current position (1-indexed)
    
    // Sort and update
    chapters.sort((a, b) => a.order - b.order);
    this._chapters.set(chapters);
    await this.saveOrderConfig();
  }

  // Move chapter down (increase order number, swap with next)
  async moveChapterDown(path: string): Promise<void> {
    const chapters = [...this._chapters()];
    const index = chapters.findIndex(c => c.path === path);
    
    if (index < 0 || index >= chapters.length - 1) return; // Already at bottom or not found
    
    // Swap with next
    const current = chapters[index];
    const next = chapters[index + 1];
    
    current.order = index + 2; // Next position (1-indexed)
    next.order = index + 1; // Current position (1-indexed)
    
    // Sort and update
    chapters.sort((a, b) => a.order - b.order);
    this._chapters.set(chapters);
    await this.saveOrderConfig();
  }

  // Create a group from selected chapters
  async createGroup(chapterPaths: string[], groupName: string): Promise<void> {
    const groupId = `group_${Date.now()}`;
    
    // Get max group order
    const groups = this._groups();
    const maxGroupOrder = groups.length > 0 
      ? Math.max(...groups.map(g => g.order)) + 1 
      : 1;

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
