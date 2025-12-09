import { Injectable, inject, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { ProjectStateService } from './project-state.service';

export interface SearchMatch {
  file_path: string;
  file_name: string;
  root_folder: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
}

export interface GroupedSearchResults {
  [rootFolder: string]: SearchMatch[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private projectState = inject(ProjectStateService);
  
  // State
  readonly isSearching = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<SearchMatch[]>([]);
  readonly groupedResults = signal<GroupedSearchResults>({});
  
  /**
   * Search in project files
   */
  async search(query: string): Promise<void> {
    const projectPath = this.projectState.currentFolderPath();
    
    if (!projectPath || !query.trim()) {
      this.searchResults.set([]);
      this.groupedResults.set({});
      return;
    }
    
    this.isSearching.set(true);
    this.searchQuery.set(query);
    
    try {
      const results = await invoke<SearchMatch[]>('search_in_project', {
        path: projectPath,
        query: query.trim()
      });
      
      this.searchResults.set(results);
      this.groupedResults.set(this.groupByRootFolder(results));
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults.set([]);
      this.groupedResults.set({});
    } finally {
      this.isSearching.set(false);
    }
  }
  
  /**
   * Clear search results
   */
  clear(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.groupedResults.set({});
  }
  
  /**
   * Group results by root folder
   */
  private groupByRootFolder(results: SearchMatch[]): GroupedSearchResults {
    const grouped: GroupedSearchResults = {};
    
    for (const result of results) {
      const folder = result.root_folder || '.';
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(result);
    }
    
    return grouped;
  }
  
  /**
   * Get sorted folder names (chapters first, then codex, then others)
   */
  getSortedFolders(): string[] {
    const folders = Object.keys(this.groupedResults());
    
    return folders.sort((a, b) => {
      // Priority order: chapters, codex, then alphabetical
      if (a === 'chapters') return -1;
      if (b === 'chapters') return 1;
      if (a === 'codex') return -1;
      if (b === 'codex') return 1;
      return a.localeCompare(b);
    });
  }
}
