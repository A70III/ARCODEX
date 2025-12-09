import { Component, inject } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between h-[22px] bg-[var(--bg-primary)] border-t border-[var(--border-color)] px-2 text-[var(--text-primary)] text-xs select-none">
      <!-- Left section -->
      <div class="flex items-center gap-3">
        @if (projectState.currentFolderPath()) {
          <span class="flex items-center gap-1 cursor-default hover:text-[var(--text-inverse)] transition-colors">
            <span class="material-icons text-sm">folder</span>
            {{ projectState.projectName() }}
          </span>
        }
        
        @if (projectState.activeFile(); as file) {
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full" [class.bg-[var(--success)]]="!file.isDirty" [class.bg-[var(--warning)]]="file.isDirty"></span>
            {{ file.isDirty ? 'Modified' : 'Saved' }}
          </span>
        }
      </div>
      
      <!-- Right section -->
      <div class="flex items-center gap-4">
        @if (projectState.activeFile(); as file) {
          <span>{{ getWordCount(file.content) }} <strong>Words</strong></span>
          <span>{{ getCharCount(file.content) }} <strong>Chars</strong></span>
        }
        <span class="opacity-70">Tales IDE v0.1.0</span>
      </div>
    </div>
  `
})
export class StatusBarComponent {
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
