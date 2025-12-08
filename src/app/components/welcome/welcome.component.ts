import { Component, inject } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { CommonModule } from '@angular/common';

interface RecentProject {
  name: string;
  path: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-[#cccccc] select-none">
      <div class="max-w-md w-full p-8">
        <!-- Logo/Header -->
        <div class="flex flex-col items-center mb-10">
          <span class="material-icons text-8xl text-[#3c3c3c] mb-4">auto_stories</span>
          <h1 class="text-3xl font-light mb-2">Tales IDE</h1>
          <p class="text-[#858585]">Your Creative Writing Companion</p>
        </div>

        <div class="grid grid-cols-2 gap-8">
          <!-- Start Section -->
          <div class="space-y-4">
            <h2 class="text-sm uppercase tracking-wide text-[#858585] font-semibold mb-3">Start</h2>
            
            <button 
              class="flex items-center gap-3 w-full text-left group hover:text-[#007acc] transition-colors"
              (click)="createNewProject()"
            >
              <span class="material-icons text-[#519aba]">create_new_folder</span>
              <div>
                <div class="text-sm">New Project</div>
                <div class="text-xs text-[#6e6e6e] group-hover:text-[#007acc]/70">Create a new novel folder</div>
              </div>
            </button>

            <button 
              class="flex items-center gap-3 w-full text-left group hover:text-[#007acc] transition-colors"
              (click)="openProject()"
            >
              <span class="material-icons text-[#dcb67a]">folder_open</span>
              <div>
                <div class="text-sm">Open Project</div>
                <div class="text-xs text-[#6e6e6e] group-hover:text-[#007acc]/70">Open existing folder</div>
              </div>
            </button>
          </div>

          <!-- Recent Section -->
          <div class="space-y-4">
            <h2 class="text-sm uppercase tracking-wide text-[#858585] font-semibold mb-3">Recent</h2>
            @if (recentProjects.length > 0) {
              <div class="space-y-2">
                @for (project of recentProjects; track project.path) {
                  <button 
                    class="flex items-center gap-2 w-full text-left text-sm hover:text-[#007acc] hover:bg-[#2a2d2e] p-1.5 -ml-1.5 rounded transition-colors group"
                    (click)="openRecent(project.path)"
                  >
                    <span class="material-icons text-base text-[#6e6e6e] group-hover:text-[#007acc]">history</span>
                    <div class="flex-1 min-w-0">
                      <div class="truncate">{{ project.name }}</div>
                      <div class="text-xs text-[#6e6e6e] truncate">{{ project.path }}</div>
                    </div>
                  </button>
                }
              </div>
            } @else {
              <div class="text-sm text-[#6e6e6e] italic">No recent projects</div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class WelcomeComponent {
  projectState = inject(ProjectStateService);
  recentProjects: RecentProject[] = [
    // TODO: Implement actual recent projects persistence
  ];

  openProject(): void {
    this.projectState.openProject();
  }

  createNewProject(): void {
    this.projectState.openProject(); 
  }

  openRecent(path: string): void {
    console.log('Open recent:', path);
  }
}
