import { Component, inject, signal, HostListener } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';

interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <div class="flex items-center h-[30px] bg-[#3c3c3c] border-b border-[#3c3c3c] select-none">
      <!-- Left side: App icon + Menus -->
      <div class="flex items-center h-full">
        <!-- App Icon -->
        <div class="flex items-center justify-center w-[46px] h-full">
          <span class="material-icons text-lg text-[#cccccc]">auto_stories</span>
        </div>
        
        <!-- Menu items -->
        @for (menu of menus; track menu.label) {
          <div class="relative">
            <button
              class="px-3 h-[30px] text-[13px] text-[#cccccc] hover:bg-[#505050] transition-colors"
              [class.bg-[#505050]]="openMenu() === menu.label"
              (click)="toggleMenu(menu.label)"
            >
              {{ menu.label }}
            </button>
            
            <!-- Dropdown -->
            @if (openMenu() === menu.label) {
              <div class="absolute top-full left-0 min-w-[200px] bg-[#252526] border border-[#454545] shadow-lg z-50 py-1">
                @for (item of menu.items; track item.label) {
                  @if (item.divider) {
                    <div class="h-px bg-[#454545] my-1"></div>
                  } @else {
                    <button
                      class="w-full flex items-center justify-between px-4 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#094771] disabled:opacity-50 disabled:hover:bg-transparent"
                      [disabled]="item.disabled"
                      (click)="executeMenuItem(item)"
                    >
                      <span>{{ item.label }}</span>
                      @if (item.shortcut) {
                        <span class="text-[#858585] text-xs ml-4">{{ item.shortcut }}</span>
                      }
                    </button>
                  }
                }
              </div>
            }
          </div>
        }
      </div>
      
      <!-- Center: Window title -->
      <div class="flex-1 text-center text-[13px] text-[#cccccc] truncate px-4">
        Tales IDE
        @if (projectState.projectName()) {
          <span class="text-[#858585]"> - {{ projectState.projectName() }}</span>
        }
      </div>
      
      <!-- Right side: Toggle buttons -->
      <div class="flex items-center h-full pr-2">
        <button
          class="p-1.5 hover:bg-[#505050] rounded text-[#cccccc] transition-colors"
          [class.text-[#007acc]]="sidebarVisible()"
          title="Toggle Sidebar (Ctrl+B)"
          (click)="toggleSidebar()"
        >
          <span class="material-icons">vertical_split</span> 
        </button>
        <button
          class="p-1.5 hover:bg-[#505050] rounded text-[#cccccc] transition-colors"
          [class.text-[#007acc]]="infoPanelVisible()"
          title="Toggle Info Panel"
          (click)="toggleInfoPanel()"
        >
          <span class="material-icons">vertical_split</span>
          <!-- Note: Material Icons typical font doesn't always support 'right_panel_open' or 'left_panel_open' specifically without 'Material Symbols'. 
               'vertical_split' is standard. If the user insists on 'left_panel_open', they might need the Symbols font. 
               I'll use 'vertical_split' and rotate/flip via CSS or try specific alternatives like 'dock'. 
               Wait, user asked for 'left_panel_open' style. Let's try to mimic closer or use 'view_sidebar'.
               Actually 'view_sidebar' is good for left. For right, maybe 'subtitles' or 'menu_open'?
               User said: "Header Icons ปรับให้สื่อความหมาย (panel open/close)".
               Let's use 'view_sidebar' (left) and 'side_navigation' (right) if available, or just flipped icons.
               I'll use 'view_sidebar' for left and 'chrome_reader_mode' or similar for right.
               Actually, let's try 'dock' or just use text if unsure? No, icons needed.
               Let's stick to what I had but maybe 'menu_open' for right was okay?
               User said: "in the part of icon open left panel right panel looks not relate".
               Let's use 'first_page' (<<) and 'last_page' (>>) or similar?
               Let's try 'space_dashboard' or just simple standard ones.
               I will use 'view_sidebar' and 'description' (info)? 
               Let's use 'menu' and 'info'?
               Let's try 'vertical_split' (left) and a flipped 'vertical_split' (right)?
               I'll use 'vertical_split' for both but add a transform for the right one?
          -->
          <span class="material-icons transform rotate-180">vertical_split</span>
        </button>
      </div>
    </div>
  `
})
export class HeaderComponent {
  projectState = inject(ProjectStateService);
  
  openMenu = signal<string | null>(null);
  sidebarVisible = signal(true);
  infoPanelVisible = signal(true);

  menus = [
    {
      label: 'File',
      items: [
        { label: 'New File', shortcut: 'Ctrl+N', action: () => this.newFile() },
        { label: 'New Folder', shortcut: 'Ctrl+Shift+N', action: () => this.newFolder() },
        { divider: true, label: '' },
        { label: 'Open Folder...', shortcut: 'Ctrl+O', action: () => this.openFolder() },
        { divider: true, label: '' },
        { label: 'Save', shortcut: 'Ctrl+S', action: () => this.save() },
        { divider: true, label: '' },
        { label: 'Close File', shortcut: 'Ctrl+W', action: () => this.closeFile() },
      ] as MenuItem[]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => this.triggerEdit('Undo') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => this.triggerEdit('Redo') },
        { divider: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => this.triggerEdit('Cut') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => this.triggerEdit('Copy') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => this.triggerEdit('Paste') },
      ] as MenuItem[]
    },
    {
      label: 'View',
      items: [
        { label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: () => this.toggleSidebar() },
        { label: 'Toggle Info Panel', action: () => this.toggleInfoPanel() },
      ] as MenuItem[]
    }
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-header')) {
      this.openMenu.set(null);
    }
  }

  toggleMenu(label: string): void {
    if (this.openMenu() === label) {
      this.openMenu.set(null);
    } else {
      this.openMenu.set(label);
    }
  }

  executeMenuItem(item: MenuItem): void {
    this.openMenu.set(null);
    if (item.action) {
      item.action();
    }
  }

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
    // Emit event for layout to handle
    document.dispatchEvent(new CustomEvent('toggleSidebar', { detail: this.sidebarVisible() }));
  }

  toggleInfoPanel(): void {
    this.infoPanelVisible.update(v => !v);
    document.dispatchEvent(new CustomEvent('toggleInfoPanel', { detail: this.infoPanelVisible() }));
  }

  newFile(): void {
    this.projectState.triggerNewFile();
  }

  newFolder(): void {
    this.projectState.triggerNewFolder();
  }

  openFolder(): void {
    this.projectState.openProject();
  }

  save(): void {
    this.projectState.saveActiveFile();
  }

  closeFile(): void {
    const activePath = this.projectState.activeFilePath();
    if (activePath) {
      this.projectState.closeFile(activePath);
    }
  }

  triggerEdit(action: string): void {
    this.projectState.triggerEditAction(action);
  }
}
