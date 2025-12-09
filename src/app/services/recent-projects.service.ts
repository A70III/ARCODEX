import { Injectable, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

export interface RecentProjectDisplay {
  path: string;
  name: string;
  author?: string;
  lastOpened?: number;
}

interface ProjectConfig {
  title: string;
  author: string;
  genre: string;
  description: string;
  createdAt: string;
}

const STORAGE_KEY = 'tales-ide-recent-projects';
const MAX_RECENT_PROJECTS = 10;

@Injectable({
  providedIn: 'root'
})
export class RecentProjectsService {
  private _recentPaths = signal<string[]>(this.loadPaths());

  constructor() {}

  private loadPaths(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load recent projects:', e);
      return [];
    }
  }

  private savePaths(paths: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
      this._recentPaths.set(paths);
    } catch (e) {
      console.error('Failed to save recent projects:', e);
    }
  }

  add(path: string): void {
    const current = this.loadPaths();
    // Remove if exists (to move to top)
    const filtered = current.filter(p => p !== path);
    // Add to top
    const updated = [path, ...filtered].slice(0, MAX_RECENT_PROJECTS);
    this.savePaths(updated);
  }

  remove(path: string): void {
    const current = this.loadPaths();
    const updated = current.filter(p => p !== path);
    this.savePaths(updated);
  }

  async getRecentProjectsWithMetadata(): Promise<RecentProjectDisplay[]> {
    const paths = this._recentPaths();
    const results: RecentProjectDisplay[] = [];

    for (const path of paths) {
      try {
        const configPath = `${path}/config.arc`;
        // We use the existing read_file_content command
        // Note: We need to handle the case where the file doesn't exist (legacy projects or deleted config)
        let config: ProjectConfig | null = null;
        
        try {
            const content = await invoke<string>('read_file_content', { path: configPath });
            config = JSON.parse(content);
        } catch (e) {
            // Config file might not exist or be unreadable, use fallback
        }

        const folderName = path.split(/[/\\]/).pop() || path;

        results.push({
          path,
          name: config?.title || folderName,
          author: config?.author,
        });
      } catch (e) {
        console.error(`Failed to load metadata for ${path}:`, e);
        // Still add it to the list, just with basic info
        results.push({
          path,
          name: path.split(/[/\\]/).pop() || path
        });
      }
    }

    return results;
  }
}
