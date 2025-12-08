import { Component, Input, inject, signal, forwardRef, HostListener, ElementRef } from '@angular/core';
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
  imports: [forwardRef(() => FileTreeComponent)],
  template: `
    @for (child of sortedChildren(); track child.path) {
      <div class="select-none">
        @if (child.is_dir) {
          <!-- Folder -->
          <div 
            class="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-[#2a2d2e] rounded-sm text-[#cccccc]"
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
          
          @if (isExpanded(child.path) && child.children) {
            <app-file-tree [node]="child" [depth]="depth + 1" />
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
            <span class="text-sm truncate text-[#cccccc]">{{ child.name }}</span>
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
      >
        @if (!contextMenu().file?.is_dir) {
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

  private projectState = inject(ProjectStateService);
  private elementRef = inject(ElementRef);
  private expandedFolders = signal<Set<string>>(new Set());
  
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
    // Close when right-clicking elsewhere
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

  openFile(): void {
    const file = this.contextMenu().file;
    if (file && !file.is_dir) {
      this.projectState.openFile(file.path);
    }
    this.closeContextMenu();
  }

  renameItem(): void {
    const file = this.contextMenu().file;
    if (file) {
      // TODO: Implement rename
      console.log('Rename:', file.path);
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
