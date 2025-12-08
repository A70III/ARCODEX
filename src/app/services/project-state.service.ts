import { Injectable, signal, computed } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { FileNode, OpenedFile } from '../models/file-node.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
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
        await this.refreshFileTree();
      }
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  }

  /**
   * Refresh file tree from current folder
   */
  async refreshFileTree(): Promise<void> {
    const path = this._currentFolderPath();
    if (!path) return;

    try {
      const tree = await invoke<FileNode>('read_project_dir', { path });
      this._fileTree.set(tree);
    } catch (error) {
      console.error('Failed to read project directory:', error);
    }
  }

  /**
   * Open a file in the editor
   */
  async openFile(filePath: string): Promise<void> {
    // Check if already opened
    const existing = this._openedFiles().find(f => f.path === filePath);
    if (existing) {
      this._activeFilePath.set(filePath);
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
    this._openedFiles.update(files =>
      files.map(f =>
        f.path === filePath
          ? { ...f, content, isDirty: true }
          : f
      )
    );
  }

  /**
   * Save file to disk
   */
  async saveFile(filePath: string): Promise<boolean> {
    const file = this._openedFiles().find(f => f.path === filePath);
    if (!file) return false;

    try {
      await invoke('save_file_content', { path: filePath, content: file.content });
      this._openedFiles.update(files =>
        files.map(f =>
          f.path === filePath
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
   * Save active file
   */
  async saveActiveFile(): Promise<boolean> {
    const activePath = this._activeFilePath();
    if (!activePath) return false;
    return this.saveFile(activePath);
  }

  /**
   * Close a file
   */
  closeFile(filePath: string): void {
    const files = this._openedFiles();
    const index = files.findIndex(f => f.path === filePath);
    
    if (index === -1) return;

    this._openedFiles.update(files => files.filter(f => f.path !== filePath));

    // Update active file if we closed the active one
    if (this._activeFilePath() === filePath) {
      const remaining = this._openedFiles();
      if (remaining.length > 0) {
        const newIndex = Math.min(index, remaining.length - 1);
        this._activeFilePath.set(remaining[newIndex].path);
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

  /**
   * Delete a file or folder
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await invoke('delete_file', { path: filePath });
      
      // Close the file if it's open
      this.closeFile(filePath);
      
      // Refresh tree
      await this.refreshFileTree();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }
}
