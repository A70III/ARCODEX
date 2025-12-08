import { Component, inject } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { ShortcutsComponent } from './shortcuts.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-panel',
  standalone: true,
  imports: [ShortcutsComponent, CommonModule],
  template: `
    <div class="flex flex-col h-full bg-[#252526] border-l border-[#3c3c3c]">
      <!-- Header -->
      <div class="flex items-center px-4 py-2 text-[11px] font-medium text-[#bbbbbb] tracking-wide uppercase border-b border-[#3c3c3c]">
        <span>Document Info</span>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        @if (projectState.activeFile(); as file) {
          <!-- File Info Section -->
          <div class="space-y-4">
            <!-- Status -->
            <div class="flex items-center gap-2">
              <span class="material-icons text-base" [class.text-green-400]="!file.isDirty" [class.text-yellow-400]="file.isDirty">
                {{ file.isDirty ? 'edit' : 'check_circle' }}
              </span>
              <span class="text-sm text-[#cccccc]">
                {{ file.isDirty ? 'Unsaved changes' : 'All changes saved' }}
              </span>
            </div>
            
            <!-- File Details -->
            <div class="space-y-2 text-sm">
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[#858585]">description</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[#858585] text-xs mb-0.5">File Name</div>
                  <div class="text-[#cccccc] truncate">{{ file.name }}</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[#858585]">folder</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[#858585] text-xs mb-0.5">Path</div>
                  <div class="text-[#cccccc] text-xs break-all">{{ file.path }}</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[#858585]">text_fields</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[#858585] text-xs mb-0.5">Word Count</div>
                  <div class="text-[#cccccc]">{{ getWordCount(file.content) }} words</div>
                </div>
              </div>
              
              <div class="flex items-start gap-2">
                <span class="material-icons text-base text-[#858585]">format_list_numbered</span>
                <div class="flex-1 min-w-0">
                  <div class="text-[#858585] text-xs mb-0.5">Character Count</div>
                  <div class="text-[#cccccc]">{{ getCharCount(file.content) }} characters</div>
                </div>
              </div>
            </div>
            
            <!-- Keyboard Shortcuts -->
            <app-shortcuts />
          </div>
        } @else {
          <!-- No file open -->
          <div class="flex flex-col items-center justify-center p-8 text-center text-[#6e6e6e]">
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
        <div class="p-3 border-t border-[#3c3c3c] bg-[#1e1e1e]">
          <div class="flex items-center gap-2 text-xs text-[#858585]">
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
