import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
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
    <div data-tauri-drag-region class="flex items-center justify-between h-[32px] bg-[var(--bg-primary)] select-none border-b border-[var(--border-color)]">
      <!-- Left: Logo & Menus -->
      <div class="flex items-center h-full pl-2">
        <div class="flex items-center gap-2 mr-3 pointer-events-none">
          <span class="material-icons text-[var(--accent)] text-lg">auto_stories</span>
          <span class="text-xs font-semibold text-[var(--text-primary)] tracking-wide pt-0.5">Tales IDE</span>
        </div>
        
        <!-- Menus (Non-draggable area) -->
        <div class="flex items-center h-full -ml-1">
          <div class="relative group h-full flex items-center">
            <button class="px-2.5 h-[22px] rounded-sm text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center transition-colors" (click)="toggleMenu('file', $event)">File</button>
            @if (activeMenu() === 'file') {
              <div class="absolute top-full left-0 mt-1 w-56 bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-[0_4px_10px_rgba(0,0,0,0.5)] rounded-sm py-1 z-50">
                <button class="menu-item" (click)="newProject()">
                  <span>New Project...</span>
                </button>
                <div class="menu-divider"></div>
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
            <button class="px-2.5 h-[22px] rounded-sm text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center transition-colors" (click)="toggleMenu('edit', $event)">Edit</button>
            @if (activeMenu() === 'edit') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-lg rounded-sm py-1 z-50">
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
            <button class="px-2.5 h-[22px] rounded-sm text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-center transition-colors" (click)="toggleMenu('view', $event)">View</button>
            @if (activeMenu() === 'view') {
              <div class="absolute top-full left-0 mt-1 w-48 bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-lg rounded-sm py-1 z-50">
                <button class="menu-item" (click)="toggleSidebar()"><span>Toggle Sidebar</span><span class="shortcut">Ctrl+B</span></button>
                <button class="menu-item" (click)="toggleInfoPanel()"><span>Toggle Info Panel</span></button>
                <div class="menu-divider"></div>
                <button class="menu-item" (click)="toggleFocusMode()">
                  <span>{{ projectState.focusMode() ? 'Exit Focus Mode' : 'Focus Mode' }}</span>
                  <span class="shortcut">F11</span>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
      
      <!-- Right: Toggles & Window Controls -->
      <div class="flex items-center h-full">
        <!-- Panel Icons (VS Code style) -->
        <div class="flex items-center mr-2 px-2 border-r border-[var(--border-color)] h-[16px]">
            <!-- Focus Mode Button -->
            <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mr-1"
            [class.text-[var(--accent)]]="projectState.focusMode()"
            [class.bg-[var(--accent-light)]]="projectState.focusMode()"
            title="Focus Mode (F11)"
            (click)="toggleFocusMode()"
            >
              <span class="material-icons text-[18px]">center_focus_strong</span>
            </button>
            
            <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            [class.text-[var(--text-inverse)]]="projectState.sidebarVisible()"
            [class.bg-[var(--bg-hover)]]="projectState.sidebarVisible()"
            title="Toggle Sidebar (Ctrl+B)"
            (click)="toggleSidebar()"
            >
              <span class="material-icons text-[18px]">view_sidebar</span> 
            </button>
            <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-1"
            [class.text-[var(--text-inverse)]]="projectState.infoPanelVisible()"
            [class.bg-[var(--bg-hover)]]="projectState.infoPanelVisible()"
            title="Toggle Info Panel"
            (click)="toggleInfoPanel()"
            >
              <span class="material-icons text-[18px] transform rotate-180">view_sidebar</span>
            </button>
        </div>

        <!-- Window Controls (Windows only - hidden on macOS) -->
        @if (!isMacOS()) {
          <div class="flex items-center h-full">
              <button class="window-control hover:bg-[var(--bg-hover)]" (click)="minimizeWindow()" title="Minimize">
                 <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 5H10" [attr.stroke]="'var(--text-primary)'" stroke-width="1"/>
                 </svg>
              </button>
              <button class="window-control hover:bg-[var(--bg-hover)]" (click)="toggleMaximizeWindow()" title="Maximize">
                 <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1.5H8.5V8.5H1.5V1.5Z" [attr.stroke]="'var(--text-primary)'" stroke-width="1" fill="none"/>
                 </svg>
              </button>
              <button class="window-control hover:bg-[var(--error)] hover:text-white group" (click)="closeWindow()" title="Close">
                 <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L9 9M9 1L1 9" stroke="var(--text-primary)" stroke-width="1" class="group-hover:stroke-white"/>
                 </svg>
              </button>
          </div>
        }
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
      color: var(--text-primary);
      transition: background-color 0.1s;
    }
    .menu-item:hover {
      background-color: var(--bg-active);
      color: var(--text-inverse);
    }
    .menu-item .shortcut {
      color: var(--text-secondary);
      margin-left: 12px;
    }
    .menu-item:hover .shortcut {
      color: var(--text-primary);
    }
    .menu-divider {
      height: 1px;
      background-color: var(--border-light);
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
export class HeaderComponent implements OnInit {
  projectState = inject(ProjectStateService);
  
  activeMenu = signal<string | null>(null);
  private _isMacOS = signal<boolean>(false);

  ngOnInit(): void {
    // Detect macOS using userAgent
    const userAgent = navigator.userAgent.toLowerCase();
    this._isMacOS.set(userAgent.includes('mac os') || userAgent.includes('macintosh'));
  }

  isMacOS(): boolean {
    return this._isMacOS();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-header')) {
      this.activeMenu.set(null);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F11') {
      event.preventDefault();
      this.toggleFocusMode();
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

  toggleFocusMode(): void {
    this.activeMenu.set(null);
    this.projectState.toggleFocusMode();
  }

  newProject(): void {
    this.activeMenu.set(null);
    this.projectState.openNewProjectDialog();
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
