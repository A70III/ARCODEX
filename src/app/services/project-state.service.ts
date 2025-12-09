import { Injectable, signal, computed, inject } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { FileNode, OpenedFile } from '../models/file-node.model';
import { RecentProjectsService } from './recent-projects.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  // UI State
  readonly sidebarVisible = signal<boolean>(true);
  readonly infoPanelVisible = signal<boolean>(true);
  readonly focusMode = signal<boolean>(false);
  readonly newProjectDialogOpen = signal<boolean>(false);
  
  // Temporary storage for folder path during new project creation
  private _newProjectBasePath = '';

  recentProjectsService = inject(RecentProjectsService);

  // State signals
  private _currentFolderPath = signal<string>('');
  private _fileTree = signal<FileNode | null>(null);
  private _openedFiles = signal<OpenedFile[]>([]);
  private _activeFilePath = signal<string>('');

  // Public readonly signals
  readonly currentFolderPath = this._currentFolderPath.asReadonly();
  readonly fileTree = this._fileTree.asReadonly();
  readonly openedFiles = this._openedFiles.asReadonly();
  readonly activeFilePath = this._activeFilePath.asReadonly();

  // Computed signal for active file
  readonly activeFile = computed(() => {
    const path = this._activeFilePath();
    return this._openedFiles().find(f => f.path === path) || null;
  });

  // Computed signal for project name
  readonly projectName = computed(() => {
    const path = this._currentFolderPath();
    if (!path) return '';
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || '';
  });

  /**
   * Open project folder dialog
   */
  async openProject(): Promise<void> {
    try {
      const path = await invoke<string | null>('open_project_dialog');
      if (path) {
        this._currentFolderPath.set(path);
        this.recentProjectsService.add(path);
        await this.refreshFileTree();
      }
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  }

  /**
   * Open project by path (for recent projects)
   */
  async openProjectByPath(path: string): Promise<void> {
    try {
      this._currentFolderPath.set(path);
      this.recentProjectsService.add(path);
      await this.refreshFileTree();
    } catch (error) {
      console.error('Failed to open project:', error);
      // If failed (e.g. folder deleted), maybe remove from recent?
      // For now, let's just log it. The user can manually remove it if we add that UI later.
    }
  }

  /**
   * Close the current project
   */
  closeProject(): void {
    this._currentFolderPath.set('');
    this._fileTree.set(null);
    this._openedFiles.set([]);
    this._activeFilePath.set('');
  }

  /**
   * Open new project dialog - first asks for folder location
   */
  async openNewProjectDialog(): Promise<void> {
    try {
      const path = await invoke<string | null>('open_project_dialog');
      if (path) {
        this._newProjectBasePath = path;
        this.newProjectDialogOpen.set(true);
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
    }
  }

  /**
   * Close new project dialog
   */
  closeNewProjectDialog(): void {
    this.newProjectDialogOpen.set(false);
    this._newProjectBasePath = '';
  }

  /**
   * Create a new project with boilerplate structure
   */
  async createNewProject(config: { title: string; author: string; genre: string; description: string }): Promise<void> {
    if (!this._newProjectBasePath) {
      throw new Error('No base path selected');
    }

    try {
      const projectPath = await invoke<string>('create_new_project', {
        basePath: this._newProjectBasePath,
        config
      });
      
      // Close dialog and open the new project
      this.closeNewProjectDialog();
      
      // Set the new project as current and refresh tree
      this._currentFolderPath.set(projectPath);
      this.recentProjectsService.add(projectPath);
      await this.refreshFileTree();
    } catch (error: any) {
      throw new Error(error || 'Failed to create project');
    }
  }

  /**
   * Helper to ensure tree is refreshed after file operations
   */
  async refreshFileTree(): Promise<void> {
    const path = this._currentFolderPath();
    if (!path) return;

    try {
      // Small delay to ensure fs operation completes (sometimes needed on Windows)
      await new Promise(resolve => setTimeout(resolve, 100));
      const tree = await invoke<FileNode>('read_project_dir', { path });
      this._fileTree.set(tree);
    } catch (error) {
      console.error('Failed to read project directory:', error);
    }
  }

  /**
   * Normalize path for consistent comparison (handle Windows backslashes)
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Open a file in the editor
   */
  async openFile(filePath: string): Promise<void> {
    const normalizedTarget = this.normalizePath(filePath);
    
    // Check if already opened
    const existing = this._openedFiles().find(f => this.normalizePath(f.path) === normalizedTarget);
    if (existing) {
      this._activeFilePath.set(existing.path);
      return;
    }

    try {
      const content = await invoke<string>('read_file_content', { path: filePath });
      const fileName = filePath.split(/[/\\]/).pop() || 'Untitled';
      
      const newFile: OpenedFile = {
        path: filePath,
        name: fileName,
        content,
        isDirty: false
      };

      this._openedFiles.update(files => [...files, newFile]);
      this._activeFilePath.set(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }

  /**
   * Update file content (marks as dirty)
   */
  updateFileContent(filePath: string, content: string): void {
    const normalizedTarget = this.normalizePath(filePath);
    this._openedFiles.update(files =>
      files.map(f =>
        this.normalizePath(f.path) === normalizedTarget
          ? { ...f, content, isDirty: true }
          : f
      )
    );
  }

  /**
   * Save file to disk
   */
  async saveFile(filePath: string): Promise<boolean> {
    const normalizedTarget = this.normalizePath(filePath);
    const file = this._openedFiles().find(f => this.normalizePath(f.path) === normalizedTarget);
    
    if (!file) {
      // Try to find by exact match if normalization failed (fallback)
      const exactFile = this._openedFiles().find(f => f.path === filePath);
      if (!exactFile) return false;
      return this.saveFileInternal(exactFile.path, exactFile.content);
    }

    return this.saveFileInternal(file.path, file.content);
  }

  private async saveFileInternal(path: string, content: string): Promise<boolean> {
    try {
      await invoke('save_file_content', { path, content });
      
      // Update dirty status
      const normalizedTarget = this.normalizePath(path);
      this._openedFiles.update(files =>
        files.map(f =>
          this.normalizePath(f.path) === normalizedTarget
            ? { ...f, isDirty: false }
          : f
        )
      );
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  /**
   * Close a file
   */
  closeFile(filePath: string): void {
    const files = this._openedFiles();
    const index = files.findIndex(f => f.path === filePath);
    
    if (index === -1) return;

    const newFiles = files.filter((_, i) => i !== index);
    this._openedFiles.set(newFiles);

    // Update active file if we closed the active one
    if (this._activeFilePath() === filePath) {
      if (newFiles.length > 0) {
        const newIndex = Math.min(index, newFiles.length - 1);
        this._activeFilePath.set(newFiles[newIndex].path);
      } else {
        this._activeFilePath.set('');
      }
    }
  }

  /**
   * Set active file
   */
  setActiveFile(filePath: string): void {
    this._activeFilePath.set(filePath);
  }

  /**
   * Create new file
   */
  async createFile(parentPath: string, fileName: string): Promise<void> {
    const filePath = `${parentPath}/${fileName}`;
    try {
      await invoke('save_file_content', { path: filePath, content: '' });
      await this.refreshFileTree();
      await this.openFile(filePath);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  }

  // Confirmation State
  readonly confirmationState = signal<{ title: string; message: string; onConfirm: () => void } | null>(null);

  /**
   * Rename item
   */
  async renameItem(oldPath: string, newPath: string): Promise<void> {
    try {
      if (oldPath === newPath) return;
      await invoke('rename_item', { oldPath, newPath });
      
      // If active file was renamed, update its path in state
      const active = this.activeFile();
      if (active && active.path === oldPath) {
        this.closeFile(oldPath);
        await this.openFile(newPath); // Re-open with new path
      }
      
      await this.refreshFileTree();
    } catch (error) {
      console.error('Failed to rename item:', error);
    }
  }

  /**
   * Request delete with confirmation
   */
  requestDelete(path: string): void {
    this.confirmationState.set({
      title: 'Delete Item',
      message: `Are you sure you want to delete '${path.split('/').pop()}'?`,
      onConfirm: () => {
        this.deleteFile(path);
        this.confirmationState.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.confirmationState.set(null);
  }

  /**
   * Delete a file or folder (Internal)
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      await invoke('delete_file', { path: filePath });
      this.closeFile(filePath);
      await this.refreshFileTree();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  /**
   * Create new folder
   */
  async createFolder(parentPath: string, folderName: string): Promise<void> {
    const folderPath = `${parentPath}/${folderName}`;
    try {
      await invoke('create_folder', { path: folderPath });
      await this.refreshFileTree();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }

  /**
   * Trigger new file creation event
   */
  triggerNewFile(): void {
    document.dispatchEvent(new CustomEvent('newFile'));
  }

  /**
   * Trigger new folder creation event
   */
  triggerNewFolder(): void {
    document.dispatchEvent(new CustomEvent('newFolder'));
  }

  /**
   * Toggle Sidebar
   */
  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
  }

  /**
   * Toggle Info Panel
   */
  toggleInfoPanel(): void {
    this.infoPanelVisible.update(v => !v);
  }

  /**
   * Toggle Focus Mode - hides all UI except editor for distraction-free writing
   */
  toggleFocusMode(): void {
    this.focusMode.update(v => !v);
  }

  /**
   * Save the currently active file
   */
  async saveActiveFile(): Promise<void> {
    const activePath = this._activeFilePath();
    if (activePath) {
      await this.saveFile(activePath);
    }
  }

  /**
   * Save all opened files
   */
  async saveAllFiles(): Promise<void> {
    const files = this._openedFiles();
    for (const file of files) {
      if (file.isDirty) {
        await this.saveFile(file.path);
      }
    }
  }

  /**
   * Trigger edit action (undo, redo, etc.)
   */
  triggerEditAction(action: string): void {
    document.dispatchEvent(new CustomEvent('editorAction', { detail: action }));
  }
}
