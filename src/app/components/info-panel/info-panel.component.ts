import { Component, inject } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { ShortcutsComponent } from './shortcuts.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-panel',
  standalone: true,
  imports: [ShortcutsComponent, CommonModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-secondary)] border-l border-[var(--border-color)]">
      <!-- Header -->
      <div class="flex items-center px-4 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase border-b border-[var(--border-color)]">
        <span>Document Info</span>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        @if (projectState.activeFile(); as file) {
          <!-- File Info Section -->
          <div class="space-y-4">
            <!-- Status -->
            <div class="flex items-center gap-2">
              <span class="material-icons text-base" [class.text-[var(--success)]]="!file.isDirty" [class.text-[var(--warning)]]="file.isDirty">
                {{ file.isDirty ? 'edit' : 'check_circle' }}
              </span>
              <span class="text-sm text-[var(--text-primary)]">
                {{ file.isDirty ? 'Unsaved changes' : 'All changes saved' }}
              </span>
            </div>
            
            <!-- File Details -->
            <div class="space-y-2 text-sm">
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[var(--text-secondary)]">description</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[var(--text-secondary)] text-xs mb-0.5">File Name</div>
                  <div class="text-[var(--text-primary)] truncate">{{ file.name }}</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[var(--text-secondary)]">folder</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[var(--text-secondary)] text-xs mb-0.5">Path</div>
                  <div class="text-[var(--text-primary)] text-xs break-all">{{ file.path }}</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[var(--text-secondary)]">text_fields</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[var(--text-secondary)] text-xs mb-0.5">Word Count</div>
                  <div class="text-[var(--text-primary)]">{{ getWordCount(file.content) }} words</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[var(--text-secondary)]">format_list_numbered</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[var(--text-secondary)] text-xs mb-0.5">Character Count</div>
                  <div class="text-[var(--text-primary)]">{{ getCharCount(file.content) }} characters</div>
                </div>
              </div>
            </div>
            
            <!-- Keyboard Shortcuts -->
            <app-shortcuts />
          </div>
        } @else {
          <!-- No file open -->
          <div class="flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
            <span class="material-icons text-4xl mb-2 opacity-50">info</span>
            <p class="text-sm">Open a file to see document info</p>
          </div>
          
          <div class="px-4 pb-4 mt-auto">
             <app-shortcuts />
          </div>
        }
      </div>
      
      <!-- Project Info Footer -->
      @if (projectState.currentFolderPath()) {
        <div class="p-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div class="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span class="material-icons text-sm">folder_open</span>
            <span class="truncate">{{ projectState.projectName() }}</span>
          </div>
        </div>
      }
    </div>
  `
})
export class InfoPanelComponent {
  projectState = inject(ProjectStateService);

  getWordCount(content: string): number {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return 0;

    try {
      // @ts-ignore
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        // @ts-ignore
        const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
        let count = 0;
        // @ts-ignore
        for (const segment of segmenter.segment(text)) {
          if (segment.isWordLike) {
            count++;
          }
        }
        return count;
      }
    } catch (e) {
      // Fallback
    }
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  getCharCount(content: string): number {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, '').replace(/\s/g, '');
    return text.length;
  }
}
