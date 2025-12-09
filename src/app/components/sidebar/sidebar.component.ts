import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectStateService } from '../../services/project-state.service';
import { FileTreeComponent } from '../file-tree/file-tree.component';
import { SearchPanelComponent } from '../search-panel/search-panel.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FileTreeComponent, SearchPanelComponent, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)]" (contextmenu)="onContextMenu($event)">
      
      <!-- Explorer View -->
      @if (projectState.activeSidebarView() === 'explorer') {
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
          <span>Explorer</span>
        </div>
        
        <!-- Project section -->
        @if (projectState.currentFolderPath()) {
          <!-- Project name header with actions -->
          <div class="flex items-center justify-between px-2 py-1 hover:bg-[var(--bg-hover)] group">
            <div 
              class="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-primary)] uppercase cursor-pointer flex-1"
              (click)="toggleProjectExpanded()"
            >
              <span class="material-icons text-base text-[var(--text-primary)]">
                {{ projectExpanded() ? 'expand_more' : 'chevron_right' }}
              </span>
              <span class="truncate">{{ projectState.projectName() }}</span>
            </div>
            
            <!-- Action buttons - visible on hover -->
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
                title="New File"
                (click)="startNewFile($event)"
              >
                <span class="material-icons text-base">note_add</span>
              </button>
              <button 
                class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
                title="New Folder"
                (click)="startNewFolder($event)"
              >
                <span class="material-icons text-base">create_new_folder</span>
              </button>
              <button 
                class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
                title="Refresh Explorer"
                (click)="onRefresh($event)"
              >
                <span class="material-icons text-base" [class.animate-spin]="isRefreshing()">refresh</span>
              </button>
            </div>
          </div>
          
          <!-- Inline new file/folder input -->
          @if (isCreating()) {
            <div class="flex items-center gap-1 px-2 py-1 ml-4">
              <span class="material-icons text-base" [class.text-[var(--warning)]]="creatingType() === 'folder'" [class.text-[var(--info)]]="creatingType() === 'file'">
                {{ creatingType() === 'folder' ? 'folder' : 'description' }}
              </span>
              <input
                #newItemInput
                type="text"
                class="flex-1 bg-[var(--bg-hover)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-2 py-0.5 rounded outline-none"
                [placeholder]="creatingType() === 'folder' ? 'Folder name' : 'File name (e.g., chapter1.md)'"
                [(ngModel)]="newItemName"
                (keydown.enter)="confirmCreate()"
                (keydown.escape)="cancelCreate()"
                (blur)="onInputBlur()"
              />
            </div>
          }
          
          <!-- File tree -->
          @if (projectExpanded() && projectState.fileTree()) {
            <div class="flex-1 overflow-y-auto pl-2">
              <app-file-tree [node]="projectState.fileTree()!" [depth]="0" />
            </div>
          }
        } @else {
          <!-- No folder opened -->
          <div class="flex flex-col items-center justify-center flex-1 px-4 text-center">
            <span class="material-icons text-5xl text-[var(--border-color)] mb-4">folder_open</span>
            <p class="text-[var(--text-secondary)] text-sm mb-4">You have not yet opened a folder.</p>
            <button
              class="w-full px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] text-sm rounded transition-colors"
              (click)="onOpenProject()"
            >
              Open Folder
            </button>
            <p class="text-[var(--text-muted)] text-xs mt-4">
              Open a folder to start working on your novel
            </p>
          </div>
        }
      } 
      
      <!-- Search View -->
      @if (projectState.activeSidebarView() === 'search') {
        <app-search-panel class="flex-1 overflow-hidden" />
      }
    </div>
    
    <!-- Context Menu for Root -->
    @if (contextMenu().visible) {
      <div 
        class="fixed bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-lg z-[1000] py-1 min-w-[160px]"
        [style.left.px]="contextMenu().x"
        [style.top.px]="contextMenu().y"
        (click)="$event.stopPropagation()"
      >
        <button 
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="startNewFile($event); contextMenu().visible = false"
        >
          <span class="material-icons text-base">note_add</span>
          New File
        </button>
        <button 
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="startNewFolder($event); contextMenu().visible = false"
        >
          <span class="material-icons text-base">create_new_folder</span>
          New Folder
        </button>
      </div>
    }
  `
})
export class SidebarComponent {
  projectState = inject(ProjectStateService);
  
  projectExpanded = signal(true);
  isCreating = signal(false);
  isRefreshing = signal(false);
  creatingType = signal<'file' | 'folder'>('file');
  newItemName = '';

  // Context Menu State
  contextMenu = signal<{ visible: boolean, x: number, y: number }>({ visible: false, x: 0, y: 0 });

  constructor() {
    // Listen for creation events
    document.addEventListener('newFile', ((e: Event) => {
      this.startNewFile(e);
    }) as EventListener);

    document.addEventListener('newFolder', ((e: Event) => {
      this.startNewFolder(e);
    }) as EventListener);

    // Close context menu on click elsewhere
    document.addEventListener('click', () => {
      this.contextMenu.set({ visible: false, x: 0, y: 0 });
    });
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (!this.projectState.currentFolderPath()) return;

    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  }

  toggleProjectExpanded(): void {
    this.projectExpanded.update(v => !v);
  }

  onOpenProject(): void {
    this.projectState.openProject();
  }

  async onRefresh(event: Event): Promise<void> {
    event.stopPropagation();
    this.isRefreshing.set(true);
    await this.projectState.refreshFileTree();
    this.isRefreshing.set(false);
  }

  startNewFile(event: Event): void {
    event.stopPropagation();
    if (!this.projectState.currentFolderPath()) return;
    
    this.projectExpanded.set(true);
    this.isCreating.set(true);
    this.creatingType.set('file');
    this.newItemName = '';
    
    // Focus input after render
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      input?.focus();
    }, 0);
  }

  startNewFolder(event: Event): void {
    event.stopPropagation();
    if (!this.projectState.currentFolderPath()) return;

    this.projectExpanded.set(true);
    this.isCreating.set(true);
    this.creatingType.set('folder');
    this.newItemName = '';
    
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      input?.focus();
    }, 0);
  }

  confirmCreate(): void {
    if (!this.newItemName.trim()) {
      this.cancelCreate();
      return;
    }

    const basePath = this.projectState.currentFolderPath();
    if (!basePath) return;

    if (this.creatingType() === 'file') {
      // Add .md extension if not present
      let fileName = this.newItemName.trim();
      if (!fileName.includes('.')) {
        fileName += '.md';
      }
      this.projectState.createFile(basePath, fileName);
    } else {
      // Create folder
      this.projectState.createFolder(basePath, this.newItemName.trim());
    }

    this.cancelCreate();
  }

  cancelCreate(): void {
    this.isCreating.set(false);
    this.newItemName = '';
  }

  onInputBlur(): void {
    // Small delay to allow Enter key to work
    setTimeout(() => {
      if (this.isCreating()) {
        this.cancelCreate();
      }
    }, 150);
  }
}
