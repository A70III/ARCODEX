import { Component, inject, computed } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  template: `
    <div class="flex items-center justify-between h-[22px] bg-[#007acc] px-2 text-white text-xs select-none">
      <!-- Left section -->
      <div class="flex items-center gap-3">
        @if (projectState.currentFolderPath()) {
          <span class="flex items-center gap-1 cursor-default">
            <span class="material-icons text-sm">folder</span>
            {{ projectState.projectName() }}
          </span>
        }
        
        @if (projectState.activeFile(); as file) {
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full" [class.bg-green-300]="!file.isDirty" [class.bg-yellow-300]="file.isDirty"></span>
            {{ file.isDirty ? 'Modified' : 'Saved' }}
          </span>
        }
      </div>
      
      <!-- Right section -->
      <div class="flex items-center gap-4">
        @if (projectState.activeFile(); as file) {
          <span>{{ getWordCount(file.content) }} words</span>
          <span>{{ file.content.length }} chars</span>
        }
        <span>Tales IDE v0.1.0</span>
      </div>
    </div>
  `
})
export class StatusBarComponent {
  projectState = inject(ProjectStateService);

  getWordCount(content: string): number {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }
}
