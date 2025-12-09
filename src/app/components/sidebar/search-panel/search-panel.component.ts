import { Component, inject, signal, computed, Pipe, PipeTransform, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchService, SearchMatch } from '../../../services/search.service';
import { ProjectStateService } from '../../../services/project-state.service';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [FormsModule, CommonModule, forwardRef(() => HighlightMatchPipe)],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-secondary)]">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
        <span>Search</span>
      </div>
      
      <!-- Search Input -->
      <div class="px-3 pb-3">
        <div class="relative">
          <span class="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-base text-[var(--text-secondary)]">
            search
          </span>
          <input
            type="text"
            class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm pl-8 pr-8 py-1.5 rounded outline-none focus:border-[var(--accent)] transition-colors"
            placeholder="Search in files..."
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            (keydown.enter)="performSearch()"
          />
          @if (searchQuery) {
            <button 
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              (click)="clearSearch()"
            >
              <span class="material-icons text-base">close</span>
            </button>
          }
        </div>
      </div>
      
      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto px-2">
        @if (searchService.isSearching()) {
          <div class="flex items-center justify-center py-8">
            <span class="material-icons text-2xl text-[var(--text-secondary)] animate-spin">autorenew</span>
          </div>
        } @else if (hasSearched() && totalResults() === 0) {
          <div class="flex flex-col items-center justify-center py-8 text-center px-4">
            <span class="material-icons text-3xl text-[var(--border-color)] mb-2">search_off</span>
            <p class="text-[var(--text-secondary)] text-sm">No results found</p>
            <p class="text-[var(--text-muted)] text-xs mt-1">Try different keywords</p>
          </div>
        } @else if (totalResults() > 0) {
          <div class="text-xs text-[var(--text-secondary)] px-2 pb-2">
            {{ totalResults() }} results in {{ folderCount() }} {{ folderCount() === 1 ? 'folder' : 'folders' }}
          </div>
          
          @for (folder of sortedFolders(); track folder) {
            <div class="mb-3">
              <!-- Folder Header -->
              <div 
                class="flex items-center gap-1 py-1 px-1 cursor-pointer hover:bg-[var(--bg-hover)] rounded-sm"
                (click)="toggleFolder(folder)"
              >
                <span class="material-icons text-sm text-[var(--text-primary)]">
                  {{ isFolderExpanded(folder) ? 'expand_more' : 'chevron_right' }}
                </span>
                <span class="material-icons text-base text-[var(--warning)]">folder</span>
                <span class="text-sm font-medium text-[var(--text-primary)] truncate flex-1">{{ folder }}</span>
                <span class="text-xs text-[var(--text-secondary)] mr-2">
                  {{ getFolderResults(folder).length }}
                </span>
              </div>
              
              <!-- Folder Results -->
              @if (isFolderExpanded(folder)) {
                <div class="ml-4">
                  @for (result of getFolderResults(folder); track $index) {
                    <div 
                      class="flex flex-col py-1.5 px-2 cursor-pointer hover:bg-[var(--bg-hover)] rounded-sm border-l-2 border-transparent hover:border-[var(--accent)]"
                      (click)="openResult(result)"
                    >
                      <!-- File info -->
                      <div class="flex items-center gap-1.5">
                        <span class="material-icons text-sm" [class]="getFileIconClass(result.file_name)">
                          {{ getFileIcon(result.file_name) }}
                        </span>
                        <span class="text-xs text-[var(--text-primary)] truncate">{{ result.file_name }}</span>
                        <span class="text-xs text-[var(--text-muted)]">: {{ result.line_number }}</span>
                      </div>
                      <!-- Match content -->
                      <div class="text-xs text-[var(--text-secondary)] truncate mt-0.5 pl-5" [innerHTML]="result | highlightMatch">
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        } @else {
          <!-- Initial state -->
          <div class="flex flex-col items-center justify-center py-8 text-center px-4">
            <span class="material-icons text-4xl text-[var(--border-color)] mb-3">manage_search</span>
            <p class="text-[var(--text-secondary)] text-sm">Search in project files</p>
            <p class="text-[var(--text-muted)] text-xs mt-1">Type and press Enter to search</p>
          </div>
        }
      </div>
    </div>
  `
})
export class SearchPanelComponent {
  searchService = inject(SearchService);
  private projectState = inject(ProjectStateService);
  
  searchQuery = '';
  expandedFolders = signal<Set<string>>(new Set());
  hasSearched = signal(false);
  private searchDebounceTimer: any = null;
  
  // Computed signals
  totalResults = computed(() => this.searchService.searchResults().length);
  folderCount = computed(() => Object.keys(this.searchService.groupedResults()).length);
  sortedFolders = computed(() => this.searchService.getSortedFolders());
  
  onSearchInput(): void {
    // Debounce search for better UX
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    if (!this.searchQuery.trim()) {
      this.searchService.clear();
      this.hasSearched.set(false);
      return;
    }
    
    // Auto search after 500ms of no typing
    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch();
    }, 500);
  }
  
  performSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    if (!this.searchQuery.trim()) {
      return;
    }
    
    this.hasSearched.set(true);
    
    // Initially expand all folders with results
    this.searchService.search(this.searchQuery).then(() => {
      const folders = this.searchService.getSortedFolders();
      this.expandedFolders.set(new Set(folders));
    });
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.searchService.clear();
    this.hasSearched.set(false);
    this.expandedFolders.set(new Set());
  }
  
  toggleFolder(folder: string): void {
    this.expandedFolders.update(set => {
      const newSet = new Set(set);
      if (newSet.has(folder)) {
        newSet.delete(folder);
      } else {
        newSet.add(folder);
      }
      return newSet;
    });
  }
  
  isFolderExpanded(folder: string): boolean {
    return this.expandedFolders().has(folder);
  }
  
  getFolderResults(folder: string): SearchMatch[] {
    return this.searchService.groupedResults()[folder] || [];
  }
  
  openResult(result: SearchMatch): void {
    this.projectState.navigateToMatch(result.file_path, result);
  }
  
  // highlightMatch moved to Pipe
  
  getFileIcon(fileName: string): string {
    if (fileName.endsWith('.arc')) return 'auto_stories';
    if (fileName.endsWith('.md')) return 'description';
    if (fileName.endsWith('.txt')) return 'article';
    if (fileName.endsWith('.json')) return 'data_object';
    return 'insert_drive_file';
  }

  getFileIconClass(fileName: string): string {
    if (fileName.endsWith('.arc')) return 'text-[var(--accent)]';
    if (fileName.endsWith('.md')) return 'text-[var(--info)]';
    if (fileName.endsWith('.txt')) return 'text-[var(--text-secondary)]';
    if (fileName.endsWith('.json')) return 'text-[var(--warning)]';
    return 'text-[var(--text-secondary)]';
  }
}

@Pipe({
  name: 'highlightMatch',
  standalone: true
})
export class HighlightMatchPipe implements PipeTransform {
  transform(result: SearchMatch): string {
    const line = result.line_content;
    const start = result.match_start;
    const end = result.match_end;
    
    // Escape HTML
    const escape = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const before = escape(line.substring(0, start));
    const match = escape(line.substring(start, end));
    const after = escape(line.substring(end));
    
    return `${before}<span class="text-[var(--accent)] font-medium">${match}</span>${after}`;
  }
}
