import { Component, inject, signal } from "@angular/core";
import { SettingsService } from "../../services/settings.service";
import { ProjectStateService } from "../../services/project-state.service";

interface ActivityItem {
  icon: string;
  label: string;
  id: string;
}

@Component({
  selector: "app-activity-bar",
  standalone: true,
  template: `
    <div
      class="flex flex-col h-full w-12 bg-[var(--bg-secondary)] border-r border-[var(--border-color)]"
    >
      <!-- Top icons -->
      <div class="flex flex-col items-center pt-1">
        @for (item of topItems; track item.id) {
        <button
          class="w-12 h-12 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative"
          [class.text-[var(--text-inverse)]]="
            projectState.activeSidebarView() === item.id
          "
          [class.before:absolute]="projectState.activeSidebarView() === item.id"
          [class.before:left-0]="projectState.activeSidebarView() === item.id"
          [class.before:top-0]="projectState.activeSidebarView() === item.id"
          [class.before:bottom-0]="projectState.activeSidebarView() === item.id"
          [class.before:w-0.5]="projectState.activeSidebarView() === item.id"
          [class.before:bg-[var(--text-inverse)]]="
            projectState.activeSidebarView() === item.id
          "
          (click)="setActive(item.id)"
          [title]="item.label"
        >
          <span class="material-icons text-2xl">{{ item.icon }}</span>
        </button>
        }
      </div>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Bottom icons -->
      <div class="flex flex-col items-center pb-2">
        @for (item of bottomItems; track item.id) {
        <button
          class="w-12 h-12 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          [title]="item.label"
          (click)="onBottomItemClick(item.id)"
        >
          <span class="material-icons text-2xl">{{ item.icon }}</span>
        </button>
        }
      </div>
    </div>
  `,
})
export class ActivityBarComponent {
  private settingsService = inject(SettingsService);
  projectState = inject(ProjectStateService);

  // activeItem is now managed by projectState.activeSidebarView

  topItems: ActivityItem[] = [
    { icon: "folder", label: "Explorer", id: "explorer" },
    { icon: "search", label: "Search", id: "search" },
    { icon: "format_list_bulleted", label: "Chapters", id: "chapters" },
  ];

  bottomItems: ActivityItem[] = [
    { icon: "settings", label: "Settings", id: "settings" },
  ];

  setActive(id: string): void {
    this.projectState.setActiveSidebarView(id);
  }

  onBottomItemClick(id: string): void {
    if (id === "settings") {
      this.settingsService.openDialog();
    }
  }
}
