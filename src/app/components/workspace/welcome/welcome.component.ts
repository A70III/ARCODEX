import { Component, inject } from '@angular/core';
import { ProjectStateService } from '../../../services/project-state.service';
import { RecentProjectsService, RecentProjectDisplay } from '../../../services/recent-projects.service';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full bg-[var(--bg-primary)] text-[var(--text-primary)] select-none">
      <div class="max-w-md w-full p-8">
        <!-- Logo/Header -->
        <div class="flex flex-col items-center mb-10">
          <span class="material-icons text-8xl text-[var(--border-color)] mb-4">auto_stories</span>
          <h1 class="text-3xl font-light mb-2">Arc</h1>
          <p class="text-[var(--text-secondary)]">Your Creative Writing Companion</p>
        </div>

        <div class="grid grid-cols-2 gap-8">
          <!-- Start Section -->
          <div class="space-y-4">
            <h2 class="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-3">Start</h2>
            
            <button 
              class="flex items-center gap-3 w-full text-left group hover:text-[var(--accent)] transition-colors"
              (click)="createNewProject()"
            >
              <span class="material-icons text-[var(--info)]">create_new_folder</span>
              <div>
                <div class="text-sm">New Project</div>
                <div class="text-xs text-[var(--text-muted)] group-hover:text-[var(--accent)]/70">Create a new novel folder</div>
              </div>
            </button>

            <button 
              class="flex items-center gap-3 w-full text-left group hover:text-[var(--accent)] transition-colors"
              (click)="openProject()"
            >
              <span class="material-icons text-[var(--warning)]">folder_open</span>
              <div>
                <div class="text-sm">Open Project</div>
                <div class="text-xs text-[var(--text-muted)] group-hover:text-[var(--accent)]/70">Open existing folder</div>
              </div>
            </button>
          </div>

          <!-- Recent Section -->
          <div class="space-y-4">
            <h2 class="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-3">Recent</h2>
            @if (recentProjects.length > 0) {
              <div class="space-y-2">
                @for (project of recentProjects; track project.path) {
                  <button 
                    class="flex items-center gap-2 w-full text-left text-sm hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] p-2 -ml-2 rounded transition-colors group"
                    (click)="openRecent(project.path)"
                  >
                    <span class="material-icons text-2xl text-[var(--text-muted)] group-hover:text-[var(--accent)]">book</span>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">{{ project.name }}</div>
                      <div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        @if (project.author) {
                          <span class="truncate max-w-[100px]">{{ project.author }}</span>
                          <span class="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
                        }
                        <span class="truncate opacity-70">{{ project.path }}</span>
                      </div>
                    </div>
                  </button>
                }
              </div>
            } @else {
              <div class="text-sm text-[var(--text-muted)] italic">No recent projects</div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class WelcomeComponent {
  projectState = inject(ProjectStateService);
  recentProjectsService = inject(RecentProjectsService);
  recentProjects: RecentProjectDisplay[] = [];

  constructor() {
    this.loadRecentProjects();
  }

  async loadRecentProjects() {
    this.recentProjects = await this.recentProjectsService.getRecentProjectsWithMetadata();
  }

  openProject(): void {
    this.projectState.openProject();
  }

  createNewProject(): void {
    this.projectState.openNewProjectDialog(); 
  }

  openRecent(path: string): void {
    this.projectState.openProjectByPath(path);
  }
}
