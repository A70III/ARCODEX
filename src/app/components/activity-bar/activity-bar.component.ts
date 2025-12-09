import { Component, inject, signal } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

interface ActivityItem {
  icon: string;
  label: string;
  id: string;
}

@Component({
  selector: 'app-activity-bar',
  standalone: true,
  template: `
    <div class="flex flex-col h-full w-12 bg-[#333333] border-r border-[#3c3c3c]">
      <!-- Top icons -->
      <div class="flex flex-col items-center pt-1">
        @for (item of topItems; track item.id) {
          <button
            class="w-12 h-12 flex items-center justify-center text-[#858585] hover:text-[#cccccc] transition-colors relative"
            [class.text-white]="activeItem() === item.id"
            [class.before:absolute]="activeItem() === item.id"
            [class.before:left-0]="activeItem() === item.id"
            [class.before:top-0]="activeItem() === item.id"
            [class.before:bottom-0]="activeItem() === item.id"
            [class.before:w-0.5]="activeItem() === item.id"
            [class.before:bg-white]="activeItem() === item.id"
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
            class="w-12 h-12 flex items-center justify-center text-[#858585] hover:text-[#cccccc] transition-colors"
            [title]="item.label"
            (click)="onBottomItemClick(item.id)"
          >
            <span class="material-icons text-2xl">{{ item.icon }}</span>
          </button>
        }
      </div>
    </div>
  `
})
export class ActivityBarComponent {
  private settingsService = inject(SettingsService);
  
  activeItem = signal('explorer');

  topItems: ActivityItem[] = [
    { icon: 'folder', label: 'Explorer', id: 'explorer' },
    { icon: 'search', label: 'Search', id: 'search' },
  ];

  bottomItems: ActivityItem[] = [
    { icon: 'settings', label: 'Settings', id: 'settings' }
  ];

  setActive(id: string): void {
    this.activeItem.set(id);
  }

  onBottomItemClick(id: string): void {
    if (id === 'settings') {
      this.settingsService.openDialog();
    }
  }
}
