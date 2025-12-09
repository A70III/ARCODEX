import { Component, Input, inject, signal, forwardRef, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { FileNode } from '../../models/file-node.model';
import { ProjectStateService } from '../../services/project-state.service';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file: FileNode | null;
}

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, forwardRef(() => FileTreeComponent)],
  template: `
    @for (child of sortedChildren(); track child.path) {
      <div class="select-none group">
        @if (child.is_dir) {
          <!-- Folder -->
          <div 
            class="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-[var(--bg-hover)] hover:outline hover:outline-1 hover:outline-white/20 rounded-sm text-[var(--text-primary)]"
            [style.padding-left.px]="depth * 12 + 4"
            (click)="toggleFolder(child.path)"
            (contextmenu)="onContextMenu($event, child)"
            
          >
            <span class="material-icons text-sm text-[var(--text-primary)]">
              {{ isExpanded(child.path) ? 'expand_more' : 'chevron_right' }}
            </span>
            <span class="material-icons text-base text-[var(--warning)]">
              {{ isExpanded(child.path) ? 'folder_open' : 'folder' }}
            </span>
            <span class="text-sm truncate select-none pointer-events-none">{{ child.name }}</span>
            
            <div class="ml-auto hidden group-hover:flex items-center gap-1 pr-2">
              <button 
                class="flex items-center justify-center p-1 text-[var(--text-primary)] hover:bg-[var(--bg-active)] rounded transition-colors"
                title="New File"
                (click)="$event.stopPropagation(); startCreate('file', child)"
              >
                <span class="material-icons text-sm">note_add</span>
              </button>
              <button 
                class="flex items-center justify-center p-1 text-[var(--text-primary)] hover:bg-[var(--bg-active)] rounded transition-colors"
                title="New Folder"
                (click)="$event.stopPropagation(); startCreate('folder', child)"
              >
                <span class="material-icons text-sm">create_new_folder</span>
              </button>
            </div>
          </div>
          
          @if (isExpanded(child.path)) {
            <!-- Inline Creation Input -->
            @if (creatingChildState().parentId === child.path) {
              <div class="flex items-center gap-1 py-0.5 pr-2" [style.padding-left.px]="(depth + 1) * 12 + 20">
                <span class="material-icons text-base" [class.text-[var(--warning)]]="creatingChildState().type === 'folder'" [class.text-[var(--info)]]="creatingChildState().type === 'file'">
                  {{ creatingChildState().type === 'folder' ? 'folder' : 'description' }}
                </span>
                <input
                  #newItemInput
                  type="text"
                  class="flex-1 bg-[var(--bg-hover)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-2 py-0.5 rounded outline-none min-w-[50px]"
                  [placeholder]="creatingChildState().type === 'folder' ? 'Folder Name' : 'File Name'"
                  [(ngModel)]="newItemName"
                  (keydown.enter)="confirmCreate()"
                  (keydown.escape)="cancelCreate()"
                  (blur)="onInputBlur()"
                  (click)="$event.stopPropagation()"
                />
              </div>
            }

            @if (child.children) {
              <app-file-tree [node]="child" [depth]="depth + 1" />
            }
          }
        } @else {
          <!-- File -->
          <div 
            class="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-[var(--bg-hover)] rounded-sm group/file"
            [class.bg-[var(--bg-active)]]="isActive(child.path) && renamingNode()?.path !== child.path"
            [style.padding-left.px]="depth * 12 + 20"
            (click)="onFileClick(child)"
            (contextmenu)="onContextMenu($event, child)"
          >
            <span class="material-icons text-base" [class]="getFileIconClass(child.name)">
              {{ getFileIcon(child.name) }}
            </span>
            
            @if (renamingNode()?.path === child.path) {
                <input
                #renameInput
                type="text"
                class="flex-1 bg-[var(--bg-hover)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-1 py-0 rounded outline-none min-w-[50px] h-[20px]"
                [(ngModel)]="renamingNode()!.name"
                (keydown.enter)="confirmRename()"
                (keydown.escape)="cancelRename()"
                (blur)="confirmRename()"
                (click)="$event.stopPropagation()"
                />
            } @else {
                <span class="text-sm truncate text-[var(--text-primary)]" [class.text-[var(--text-inverse)]]="isActive(child.path)">{{ child.name }}</span>
            }
          </div>
        }
      </div>
    }
    
    <!-- Context Menu -->
    @if (contextMenu().visible) {
      <div 
        class="fixed bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-[9999] py-1 min-w-[160px] rounded-sm"
        [style.left.px]="contextMenu().x"
        [style.top.px]="contextMenu().y"
        (click)="$event.stopPropagation()"
      >
        @if (contextMenu().file?.is_dir) {
          <button 
            class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left transition-colors"
            (click)="startCreate('file')"
          >
            <span class="material-icons text-sm">note_add</span>
            New File
          </button>
          <button 
            class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left transition-colors"
            (click)="startCreate('folder')"
          >
            <span class="material-icons text-sm">create_new_folder</span>
            New Folder
          </button>
          <div class="h-px bg-[var(--border-light)] my-1"></div>
        } @else {
          <button 
            class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left transition-colors"
            (click)="openFile()"
          >
            <span class="material-icons text-sm">open_in_new</span>
            Open
          </button>
        }
        
        <button 
          class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left transition-colors"
          (click)="startRename()"
        >
          <span class="material-icons text-sm">edit</span>
          Rename
        </button>
        <div class="h-px bg-[var(--border-light)] my-1"></div>
        <button 
          class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--error)] hover:bg-[var(--error)]/20 text-left transition-colors"
          (click)="handleDelete()"
        >
          <span class="material-icons text-sm">delete</span>
          Delete
        </button>
      </div>
    }
  `
})
export class FileTreeComponent {
  @Input() node!: FileNode;
  @Input() depth = 0;

  projectState = inject(ProjectStateService);
  expandedFolders = signal<Set<string>>(new Set());
  
  // Creation state
  newItemName = '';
  creatingChildState = signal<{ parentId: string | null, type: 'file' | 'folder' }>({ parentId: null, type: 'file' });
  
  @ViewChild('newItemInput') newItemInput?: ElementRef<HTMLInputElement>;

  // Renaming State
  renamingNode = signal<{ path: string; name: string } | null>(null);
  @ViewChild('renameInput') renameInput?: ElementRef<HTMLInputElement>;

  contextMenu = signal<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null
  });

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeContextMenu();
  }

  @HostListener('document:contextmenu')
  onDocumentContextMenu(): void {
    this.closeContextMenu();
  }

  sortedChildren() {
    if (!this.node.children) return [];
    
    return [...this.node.children].sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }

  isExpanded(path: string): boolean {
    return this.expandedFolders().has(path);
  }

  toggleFolder(path: string): void {
    this.expandedFolders.update(set => {
      const newSet = new Set(set);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }

  isActive(path: string): boolean {
    return this.projectState.activeFilePath() === path;
  }

  onFileClick(file: FileNode): void {
    const ext = file.name.toLowerCase();
    if (ext.endsWith('.md') || ext.endsWith('.txt') || ext.endsWith('.taleside') || ext.endsWith('.json')) {
      this.projectState.openFile(file.path);
    }
  }

  onContextMenu(event: MouseEvent, file: FileNode): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      file
    });
  }

  closeContextMenu(): void {
    this.contextMenu.update(state => ({ ...state, visible: false }));
  }

  // --- Actions ---

  openFile(): void {
    const file = this.contextMenu().file;
    if (file && !file.is_dir) {
      this.projectState.openFile(file.path);
    }
    this.closeContextMenu();
  }

  startCreate(type: 'file' | 'folder', parentNode?: FileNode): void {
    const parentFile = parentNode || this.contextMenu().file;
    if (parentFile && parentFile.is_dir) {
      // Expand folder first
      this.expandedFolders.update(set => {
        const newSet = new Set(set);
        newSet.add(parentFile.path);
        return newSet;
      });

      this.creatingChildState.set({ parentId: parentFile.path, type });
      this.newItemName = '';
      
      setTimeout(() => {
        if (this.newItemInput) {
            this.newItemInput.nativeElement.focus();
        } else {
             // Fallback if viewchild update is slow
             const inputs = document.querySelectorAll('input[type="text"]');
             if(inputs.length) (inputs[inputs.length - 1] as HTMLElement).focus();
        }
      }, 50);
    }
    this.closeContextMenu();
  }

  confirmCreate(): void {
    const { parentId, type } = this.creatingChildState();
    if (!parentId || !this.newItemName.trim()) {
      this.cancelCreate();
      return;
    }

    if (type === 'file') {
      let fileName = this.newItemName.trim();
      if (!fileName.includes('.')) fileName += '.md';
      this.projectState.createFile(parentId, fileName);
    } else {
      this.projectState.createFolder(parentId, this.newItemName.trim());
    }
    
    this.cancelCreate();
  }

  cancelCreate(): void {
    this.creatingChildState.set({ parentId: null, type: 'file' });
    this.newItemName = '';
  }

  onInputBlur(): void {
    // Small delay to allow enter key to trigger first
    setTimeout(() => {
      this.cancelCreate();
    }, 150);
  }

  startRename(): void {
    const node = this.contextMenu().file;
    if (node) {
      this.renamingNode.set({ path: node.path, name: node.name });
      this.closeContextMenu();
      setTimeout(() => {
         if (this.renameInput) {
             this.renameInput.nativeElement.focus();
             this.renameInput.nativeElement.select();
         } else {
             // Fallback
             const inputs = document.querySelectorAll('input[type="text"]');
             if(inputs.length) (inputs[inputs.length - 1] as HTMLInputElement).select();
         }
      }, 50);
    }
  }

  confirmRename(): void {
    const state = this.renamingNode();
    if (!state) return;

    if (state.name.trim() && state.name !== state.path.split('/').pop() && state.name !== state.path.split('\\').pop()) {
       // Reconstruct new path roughly or let service handle it? 
       // We know the old path. We need to replace the filename.
       const separator = state.path.includes('\\') ? '\\' : '/';
       const segments = state.path.split(separator);
       segments.pop(); // Remove old name
       segments.push(state.name);
       const newPath = segments.join(separator);

       this.projectState.renameItem(state.path, newPath);
    }
    this.renamingNode.set(null);
  }

  cancelRename(): void {
    this.renamingNode.set(null);
  }

  handleDelete(): void {
    const node = this.contextMenu().file;
    if (node) {
      this.projectState.requestDelete(node.path);
      this.closeContextMenu();
    }
  }

  // --- Icons ---

  getFileIcon(fileName: string): string {
    if (fileName.endsWith('.taleside')) return 'auto_stories';
    if (fileName.endsWith('.md')) return 'description';
    if (fileName.endsWith('.txt')) return 'article';
    if (fileName.endsWith('.json')) return 'data_object';
    return 'insert_drive_file';
  }

  getFileIconClass(fileName: string): string {
    if (fileName.endsWith('.taleside')) return 'text-[var(--accent)]';
    if (fileName.endsWith('.md')) return 'text-[var(--info)]';
    if (fileName.endsWith('.txt')) return 'text-[var(--text-secondary)]';
    if (fileName.endsWith('.json')) return 'text-[var(--warning)]';
    return 'text-[var(--text-secondary)]';
  }
}
