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
    <div data-tauri-drag-region class="flex items-center justify-between h-[32px] bg-[#1e1e1e] select-none border-b border-[#3c3c3c]">
      <!-- Left: Logo & Menus -->
      <div class="flex items-center h-full pl-2">
        <div class="flex items-center gap-2 mr-3 pointer-events-none">
          <span class="material-icons text-[#007acc] text-lg">auto_stories</span>
          <span class="text-xs font-semibold text-[#cccccc] tracking-wide pt-0.5">Tales IDE</span>
        </div>
        
        <!-- Menus (Non-draggable area) -->
        <div class="flex items-center h-full -ml-1">
          <div class="relative group h-full flex items-center">
            <button class="px-2.5 h-[22px] rounded-sm text-[11px] text-[#cccccc] hover:bg-[#3c3c3c] flex items-center justify-center transition-colors" (click)="toggleMenu('file', $event)">File</button>
            @if (activeMenu() === 'file') {
              <div class="absolute top-full left-0 mt-1 w-56 bg-[#252526] border border-[#454545] shadow-[0_4px_10px_rgba(0,0,0,0.5)] rounded-sm py-1 z-50">
                <button class="menu-item" (click)="triggerNewFile()">
                  <span>New File</span><span class="shortcut">Ctrl+N</span>
                </button>
                <button class="menu-item" (click)="triggerNewFolder()">
                  <span>New Folder</span><span class="shortcut">Ctrl+Shift+N</span>
                </button>
                <div class="menu-divider"></div>
                <button class="menu-item" (click)="openProject()">
                  <span>Open Folder...</span><span class="shortcut">Ctrl+O</span>
                </button>
                <button class="menu-item" (click)="closeProject()">
                  <span>Close Folder</span>
                </button>
                <div class="menu-divider"></div>
                <button class="menu-item" (click)="saveActiveFile()">
                  <span>Save</span><span class="shortcut">Ctrl+S</span>
                </button>
                <button class="menu-item" (click)="saveAllFiles()">
                  <span>Save All</span><span class="shortcut">Ctrl+Shift+S</span>
                </button>
                <button class="menu-item" (click)="closeFile()">
                  <span>Close File</span><span class="shortcut">Ctrl+W</span>
                </button>
              </div>
            }
          </div>
          
          <div class="relative group h-full flex items-center">
            <button class="px-2.5 h-[22px] rounded-sm text-[11px] text-[#cccccc] hover:bg-[#3c3c3c] flex items-center justify-center transition-colors" (click)="toggleMenu('edit', $event)">Edit</button>
            @if (activeMenu() === 'edit') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-lg rounded-sm py-1 z-50">
                <button class="menu-item" (click)="triggerEdit('Undo')"><span>Undo</span><span class="shortcut">Ctrl+Z</span></button>
                <button class="menu-item" (click)="triggerEdit('Redo')"><span>Redo</span><span class="shortcut">Ctrl+Y</span></button>
                <div class="menu-divider"></div>
                <button class="menu-item" (click)="triggerEdit('Cut')"><span>Cut</span><span class="shortcut">Ctrl+X</span></button>
                <button class="menu-item" (click)="triggerEdit('Copy')"><span>Copy</span><span class="shortcut">Ctrl+C</span></button>
                <button class="menu-item" (click)="triggerEdit('Paste')"><span>Paste</span><span class="shortcut">Ctrl+V</span></button>
              </div>
            }
          </div>

          <div class="relative group h-full flex items-center">
            <button class="px-2.5 h-[22px] rounded-sm text-[11px] text-[#cccccc] hover:bg-[#3c3c3c] flex items-center justify-center transition-colors" (click)="toggleMenu('view', $event)">View</button>
            @if (activeMenu() === 'view') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-lg rounded-sm py-1 z-50">
                <button class="menu-item" (click)="toggleSidebar()"><span>Toggle Sidebar</span><span class="shortcut">Ctrl+B</span></button>
                <button class="menu-item" (click)="toggleInfoPanel()"><span>Toggle Info Panel</span></button>
              </div>
            }
          </div>
        </div>
      </div>
      
      <!-- Right: Toggles & Window Controls -->
      <div class="flex items-center h-full">
        <!-- Panel Icons (VS Code style) -->
        <div class="flex items-center mr-2 px-2 border-r border-[#3c3c3c] h-[16px]">
            <button
            class="p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-[#cccccc] transition-colors"
            [class.text-white]="projectState.sidebarVisible()"
            [class.bg-[#3c3c3c]]="projectState.sidebarVisible()"
            title="Toggle Sidebar (Ctrl+B)"
            (click)="toggleSidebar()"
            >
              <span class="material-icons text-[18px]">view_sidebar</span> 
            </button>
            <button
            class="p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-[#cccccc] transition-colors ml-1"
            [class.text-white]="projectState.infoPanelVisible()"
            [class.bg-[#3c3c3c]]="projectState.infoPanelVisible()"
            title="Toggle Info Panel"
            (click)="toggleInfoPanel()"
            >
              <span class="material-icons text-[18px] transform rotate-180">view_sidebar</span>
            </button>
        </div>

        <!-- Window Controls (Windows 11 SCSS) -->
        <div class="flex items-center h-full">
            <button class="window-control hover:bg-[#3c3c3c]" (click)="minimizeWindow()" title="Minimize">
               <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 5H10" stroke="#cccccc" stroke-width="1"/>
               </svg>
            </button>
            <button class="window-control hover:bg-[#3c3c3c]" (click)="toggleMaximizeWindow()" title="Maximize">
               <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 1.5H8.5V8.5H1.5V1.5Z" stroke="#cccccc" stroke-width="1" fill="none"/>
               </svg>
            </button>
            <button class="window-control hover:bg-[#e81123] hover:text-white group" (click)="closeWindow()" title="Close">
               <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L9 9M9 1L1 9" stroke="#cccccc" stroke-width="1" class="group-hover:stroke-white"/>
               </svg>
            </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      text-align: left;
      padding: 6px 16px;
      font-size: 11px;
      color: #cccccc;
      transition: background-color 0.1s;
    }
    .menu-item:hover {
      background-color: #094771;
      color: white;
    }
    .menu-item .shortcut {
      color: #858585;
      margin-left: 12px;
    }
    .menu-item:hover .shortcut {
      color: #dddddd;
    }
    .menu-divider {
      height: 1px;
      background-color: #454545;
      margin: 4px 0;
    }
    .window-control {
      height: 100%;
      width: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.1s;
      -webkit-app-region: no-drag;
    }
  `]
})
export class HeaderComponent {
  projectState = inject(ProjectStateService);
  
  activeMenu = signal<string | null>(null);

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

  toggleSidebar(): void {
    this.projectState.toggleSidebar();
  }

  toggleInfoPanel(): void {
    this.projectState.toggleInfoPanel();
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

  saveAllFiles(): void {
    this.activeMenu.set(null);
    this.projectState.saveAllFiles();
  }

  saveActiveFile(): void {
    this.activeMenu.set(null);
    this.projectState.saveActiveFile();
  }

  closeFile(): void {
    this.activeMenu.set(null);
    const activeFile = this.projectState.activeFile();
    if (activeFile) {
      this.projectState.closeFile(activeFile.path);
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
