import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectStateService } from '../../services/project-state.service';
import { getCurrentWindow } from '@tauri-apps/api/window';

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
  imports: [CommonModule],
  template: `
    <div data-tauri-drag-region class="flex items-center justify-between h-[35px] bg-[#3c3c3c] px-2 select-none">
      <!-- Left: Logo & Menus -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 mr-2 pointer-events-none">
          <span class="material-icons text-[#007acc]">auto_stories</span>
          <span class="text-sm font-semibold text-[#cccccc] tracking-wide">Tales IDE</span>
        </div>
        
        <!-- Menus -->
        <div class="flex items-center">
          <div class="relative group">
            <button class="px-2 py-1 text-xs text-[#cccccc] hover:bg-[#505050] rounded" (click)="toggleMenu('file', $event)">File</button>
            @if (activeMenu() === 'file') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-lg rounded py-1 z-50">
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerNewFile()">New File <span class="float-right text-[#858585]">Ctrl+N</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerNewFolder()">New Folder <span class="float-right text-[#858585]">Ctrl+Shift+N</span></button>
                <div class="h-px bg-[#454545] my-1"></div>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="openProject()">Open Folder... <span class="float-right text-[#858585]">Ctrl+O</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="closeProject()">Close Folder</button>
                <div class="h-px bg-[#454545] my-1"></div>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="saveActiveFile()">Save <span class="float-right text-[#858585]">Ctrl+S</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="closeFile()">Close File <span class="float-right text-[#858585]">Ctrl+W</span></button>
              </div>
            }
          </div>
          
          <div class="relative group">
            <button class="px-2 py-1 text-xs text-[#cccccc] hover:bg-[#505050] rounded" (click)="toggleMenu('edit', $event)">Edit</button>
            @if (activeMenu() === 'edit') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-lg rounded py-1 z-50">
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerEdit('Undo')">Undo <span class="float-right text-[#858585]">Ctrl+Z</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerEdit('Redo')">Redo <span class="float-right text-[#858585]">Ctrl+Y</span></button>
                <div class="h-px bg-[#454545] my-1"></div>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerEdit('Cut')">Cut <span class="float-right text-[#858585]">Ctrl+X</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerEdit('Copy')">Copy <span class="float-right text-[#858585]">Ctrl+C</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="triggerEdit('Paste')">Paste <span class="float-right text-[#858585]">Ctrl+V</span></button>
              </div>
            }
          </div>

          <div class="relative group">
            <button class="px-2 py-1 text-xs text-[#cccccc] hover:bg-[#505050] rounded" (click)="toggleMenu('view', $event)">View</button>
            @if (activeMenu() === 'view') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-lg rounded py-1 z-50">
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="toggleSidebar()">Toggle Sidebar <span class="float-right text-[#858585]">Ctrl+B</span></button>
                <button class="w-full text-left px-4 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771]" (click)="toggleInfoPanel()">Toggle Info Panel</button>
              </div>
            }
          </div>
        </div>
      </div>
      
      <!-- Right: Toggles -->
      <div class="flex items-center gap-4">
        <!-- Panel Toggles -->
        <div class="flex items-center gap-1">
            <button
            class="p-1.5 hover:bg-[#505050] rounded text-[#cccccc] transition-colors"
            [class.text-[#007acc]]="sidebarVisible()"
            title="Toggle Sidebar (Ctrl+B)"
            (click)="toggleSidebar()"
            >
            <span class="material-icons text-lg">vertical_split</span> 
            </button>
            <button
            class="p-1.5 hover:bg-[#505050] rounded text-[#cccccc] transition-colors"
            [class.text-[#007acc]]="infoPanelVisible()"
            title="Toggle Info Panel"
            (click)="toggleInfoPanel()"
            >
            <span class="material-icons text-lg transform rotate-180">vertical_split</span>
            </button>
        </div>

        <!-- Window Controls -->
        <div class="flex items-center h-full">
            <button class="p-2 hover:bg-[#505050] text-[#cccccc] transition-colors h-full flex items-center justify-center w-[46px]" (click)="minimizeWindow()">
                <span class="material-icons text-base">remove</span>
            </button>
            <button class="p-2 hover:bg-[#505050] text-[#cccccc] transition-colors h-full flex items-center justify-center w-[46px]" (click)="toggleMaximizeWindow()">
                <span class="material-icons text-base">crop_square</span>
            </button>
            <button class="p-2 hover:bg-[#e81123] hover:text-white text-[#cccccc] transition-colors h-full flex items-center justify-center w-[46px]" (click)="closeWindow()">
                <span class="material-icons text-base">close</span>
            </button>
        </div>
      </div>
    </div>
  `
})
export class HeaderComponent {
  projectState = inject(ProjectStateService);
  
  activeMenu = signal<string | null>(null);
  sidebarVisible = signal(true);
  infoPanelVisible = signal(true);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-header')) {
      this.activeMenu.set(null);
    }
  }

  toggleMenu(label: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeMenu() === label) {
      this.activeMenu.set(null);
    } else {
      this.activeMenu.set(label);
    }
  }

  executeMenuItem(action: () => void): void {
    this.activeMenu.set(null);
    action();
  }

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
    document.dispatchEvent(new CustomEvent('toggleSidebar', { detail: this.sidebarVisible() }));
  }

  toggleInfoPanel(): void {
    this.infoPanelVisible.update(v => !v);
    document.dispatchEvent(new CustomEvent('toggleInfoPanel', { detail: this.infoPanelVisible() }));
  }

  triggerNewFile(): void {
    this.activeMenu.set(null);
    this.projectState.triggerNewFile();
  }

  triggerNewFolder(): void {
    this.activeMenu.set(null);
    this.projectState.triggerNewFolder();
  }

  openProject(): void {
    this.activeMenu.set(null);
    this.projectState.openProject();
  }

  closeProject(): void {
      this.activeMenu.set(null);
      this.projectState.closeProject();
  }

  saveActiveFile(): void {
    this.activeMenu.set(null);
    this.projectState.saveActiveFile();
  }

  closeFile(): void {
    this.activeMenu.set(null);
    const activePath = this.projectState.activeFilePath();
    if (activePath) {
      this.projectState.closeFile(activePath);
    }
  }

  triggerEdit(action: string): void {
    this.activeMenu.set(null);
    this.projectState.triggerEditAction(action);
  }

  minimizeWindow(): void {
    getCurrentWindow().minimize();
  }

  toggleMaximizeWindow(): void {
    getCurrentWindow().toggleMaximize();
  }

  closeWindow(): void {
    getCurrentWindow().close();
  }
}
