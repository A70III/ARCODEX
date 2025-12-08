import { Component, Input, inject, signal, forwardRef, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Use CommonModule instead of explicit creating types usage if needed, but standalone imports works
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
  imports: [forwardRef(() => FileTreeComponent), FormsModule],
  template: `
    @for (child of sortedChildren(); track child.path) {
      <div class="select-none group">
        @if (child.is_dir) {
          <!-- Folder -->
          <div 
            class="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-[#2a2d2e] hover:outline hover:outline-1 hover:outline-white/20 rounded-sm text-[#cccccc]"
            [style.padding-left.px]="depth * 12 + 4"
            (click)="toggleFolder(child.path)"
            (contextmenu)="onContextMenu($event, child)"
          >
            <span class="material-icons text-sm text-[#cccccc]">
              {{ isExpanded(child.path) ? 'expand_more' : 'chevron_right' }}
            </span>
            <span class="material-icons text-base text-[#dcb67a]">
              {{ isExpanded(child.path) ? 'folder_open' : 'folder' }}
            </span>
            <span class="text-sm truncate">{{ child.name }}</span>
          </div>
          
          @if (isExpanded(child.path)) {
            <!-- Inline Creation Input -->
            @if (creatingChildState().parentId === child.path) {
              <div class="flex items-center gap-1 py-0.5 pr-2" [style.padding-left.px]="(depth + 1) * 12 + 20">
                <span class="material-icons text-base" [class.text-[#dcb67a]]="creatingChildState().type === 'folder'" [class.text-[#519aba]]="creatingChildState().type === 'file'">
                  {{ creatingChildState().type === 'folder' ? 'folder' : 'description' }}
                </span>
                <input
                  #newItemInput
                  type="text"
                  class="flex-1 bg-[#3c3c3c] border border-[#007acc] text-[#cccccc] text-sm px-2 py-0.5 rounded outline-none min-w-[50px]"
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
            class="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-[#2a2d2e] rounded-sm"
            [class.bg-[#094771]]="isActive(child.path)"
            [style.padding-left.px]="depth * 12 + 20"
            (click)="onFileClick(child)"
            (contextmenu)="onContextMenu($event, child)"
          >
            <span class="material-icons text-base" [class]="getFileIconClass(child.name)">
              {{ getFileIcon(child.name) }}
            </span>
            <span class="text-sm truncate text-[#cccccc]" [class.text-white]="isActive(child.path)">{{ child.name }}</span>
          </div>
        }
      </div>
    }
    
    <!-- Context Menu -->
    @if (contextMenu().visible) {
      <div 
        class="fixed bg-[#252526] border border-[#454545] shadow-lg z-[1000] py-1 min-w-[160px]"
        [style.left.px]="contextMenu().x"
        [style.top.px]="contextMenu().y"
        (click)="$event.stopPropagation()"
      >
        @if (contextMenu().file?.is_dir) {
          <button 
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
            (click)="startCreate('file')"
          >
            <span class="material-icons text-base">note_add</span>
            New File
          </button>
          <button 
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
            (click)="startCreate('folder')"
          >
            <span class="material-icons text-base">create_new_folder</span>
            New Folder
          </button>
          <div class="h-px bg-[#454545] my-1"></div>
        } @else {
          <button 
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
            (click)="openFile()"
          >
            <span class="material-icons text-base">open_in_new</span>
            Open
          </button>
        }
        
        <button 
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
          (click)="renameItem()"
        >
          <span class="material-icons text-base">edit</span>
          Rename
        </button>
        <div class="h-px bg-[#454545] my-1"></div>
        <button 
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#f48771] hover:bg-[#5a1d1d] text-left"
          (click)="deleteItem()"
        >
          <span class="material-icons text-base">delete</span>
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
    if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
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

  startCreate(type: 'file' | 'folder'): void {
    const parentFile = this.contextMenu().file;
    if (parentFile && parentFile.is_dir) {
      // Expand folder first
      this.expandedFolders.update(set => {
        const newSet = new Set(set);
        newSet.add(parentFile.path);
        return newSet;
      });

      this.creatingChildState.set({ parentId: parentFile.path, type });
      this.newItemName = '';
      
      // Auto-focus logic would go here (need ViewChild for list of inputs?)
      // Simple timeout for now since we're using *ngIf (well, @if)
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="text"]');
        const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
        lastInput?.focus();
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
    setTimeout(() => {
      this.cancelCreate();
    }, 150);
  }

  renameItem(): void {
    const file = this.contextMenu().file;
    if (file) {
      // TODO: Implement rename
    }
    this.closeContextMenu();
  }

  deleteItem(): void {
    const file = this.contextMenu().file;
    if (file) {
      if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
        this.projectState.deleteFile(file.path);
      }
    }
    this.closeContextMenu();
  }

  // --- Icons ---

  getFileIcon(fileName: string): string {
    if (fileName.endsWith('.md')) return 'description';
    if (fileName.endsWith('.txt')) return 'article';
    if (fileName.endsWith('.json')) return 'data_object';
    return 'insert_drive_file';
  }

  getFileIconClass(fileName: string): string {
    if (fileName.endsWith('.md')) return 'text-[#519aba]';
    if (fileName.endsWith('.txt')) return 'text-[#a0a0a0]';
    if (fileName.endsWith('.json')) return 'text-[#cbcb41]';
    return 'text-[#a0a0a0]';
  }
}
