import { Component, inject, signal, computed, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProjectStateService } from "../../services/project-state.service";
import { FileNode } from "../../models/file-node.model";
import { invoke } from "@tauri-apps/api/core";

interface ChapterItem {
  id: string;
  type: "file" | "group";
  name: string;
  path: string; // Absolute path
  children?: ChapterItem[];
  expanded?: boolean;
  selected?: boolean;
}

interface ChapterMetadata {
  orders: { [folderPath: string]: string[] }; // folderPath -> list of filenames
  groups: { [key: string]: { expanded: boolean } };
}

@Component({
  selector: "app-chapters",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)]"
      (click)="clearSelection()"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase"
      >
        <span>Chapters</span>
        <div class="flex items-center gap-1">
          <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
            title="New Chapter"
            (click)="$event.stopPropagation(); createNewChapter()"
          >
            <span class="material-icons text-base">note_add</span>
          </button>
          <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
            title="New Group"
            (click)="$event.stopPropagation(); createNewGroup()"
          >
            <span class="material-icons text-base">create_new_folder</span>
          </button>
          <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
            title="Refresh"
            (click)="$event.stopPropagation(); loadChapters()"
          >
            <span
              class="material-icons text-base"
              [class.animate-spin]="loading()"
              >refresh</span
            >
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        @if (loading()) {
        <div
          class="flex items-center justify-center p-4 text-[var(--text-secondary)]"
        >
          <span class="loading loading-spinner loading-sm"></span>
        </div>
        } @else if (!chaptersFolderExists()) {
        <div
          class="flex flex-col items-center justify-center p-4 text-center gap-2"
        >
          <span class="text-[var(--text-secondary)]"
            >No chapters folder found.</span
          >
          <button
            class="px-3 py-1 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)]"
            (click)="createChaptersFolder()"
          >
            Create Folder
          </button>
        </div>
        } @else {
        <div class="flex flex-col pb-4">
          @for (item of items(); track item.id) {
          <ng-container
            *ngTemplateOutlet="
              itemTemplate;
              context: { $implicit: item, depth: 0, parent: null }
            "
          ></ng-container>
          } @if (items().length === 0) {
          <div class="text-center text-[var(--text-muted)] text-xs mt-4 italic">
            No chapters yet. Create one to start.
          </div>
          }
        </div>
        }
      </div>
    </div>

    <ng-template #itemTemplate let-item let-depth="depth" let-parent="parent">
      <div
        class="group relative select-none"
        [class.bg-[var(--bg-active)]]="item.selected"
        (click)="$event.stopPropagation(); selectItem(item, $event)"
        (dblclick)="openItem(item)"
        draggable="true"
        (dragstart)="onDragStart($event, item, parent)"
        (dragover)="onDragOver($event, item)"
        (drop)="onDrop($event, item, parent)"
      >
        <div
          class="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
          [style.padding-left.px]="depth * 16 + 8"
        >
          <!-- Drag Handle -->
          <span
            class="material-icons text-[var(--text-secondary)] text-sm opacity-0 group-hover:opacity-50 cursor-grab"
            >drag_indicator</span
          >

          @if (item.type === 'group') {
          <span
            class="material-icons text-sm text-[var(--text-secondary)] cursor-pointer"
            (click)="$event.stopPropagation(); toggleGroup(item)"
          >
            {{ item.expanded ? "expand_more" : "chevron_right" }}
          </span>
          <span class="material-icons text-[var(--warning)] text-base"
            >folder</span
          >
          } @else {
          <span class="w-4"></span>
          <span class="material-icons text-[var(--text-secondary)] text-base"
            >description</span
          >
          }

          <!-- Name / Rename Input -->
          @if (renamingId() === item.id) {
          <input
            #renameInput
            type="text"
            class="flex-1 bg-[var(--bg-input)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-1 py-0 rounded outline-none min-w-[50px]"
            [ngModel]="item.name"
            (keydown.enter)="confirmRename(item, renameInput.value)"
            (keydown.escape)="cancelRename()"
            (blur)="cancelRename()"
            (click)="$event.stopPropagation()"
            autoFocus
          />
          } @else {
          <span class="flex-1 truncate text-sm">{{ item.name }}</span>
          }

          <!-- Actions -->
          <div class="hidden group-hover:flex items-center gap-1 h-6">
            <button
              class="p-0.5 hover:bg-[var(--bg-active)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Rename"
              (click)="$event.stopPropagation(); startRename(item)"
            >
              <span class="material-icons text-xs">edit</span>
            </button>
            <button
              class="p-0.5 hover:bg-[var(--bg-active)] rounded text-[var(--text-secondary)] hover:text-[var(--error)]"
              title="Delete"
              (click)="$event.stopPropagation(); deleteItem(item)"
            >
              <span class="material-icons text-xs">delete</span>
            </button>
          </div>
        </div>

        <!-- Children -->
        @if (item.type === 'group' && item.expanded && item.children) { @for
        (child of item.children; track child.id) {
        <ng-container
          *ngTemplateOutlet="
            itemTemplate;
            context: { $implicit: child, depth: depth + 1, parent: item }
          "
        ></ng-container>
        } }
      </div>
    </ng-template>
  `,
})
export class ChaptersComponent {
  projectState = inject(ProjectStateService);

  items = signal<ChapterItem[]>([]);
  loading = signal<boolean>(false);
  chaptersFolderExists = signal<boolean>(false);
  renamingId = signal<string | null>(null);

  // For drag and drop
  draggedItem: ChapterItem | null = null;
  draggedItemParent: ChapterItem | null = null;

  constructor() {
    effect(() => {
      const path = this.projectState.currentFolderPath();
      if (path) {
        this.loadChapters();
      } else {
        this.items.set([]);
        this.chaptersFolderExists.set(false);
      }
    });
  }

  async loadChapters() {
    this.loading.set(true);
    try {
      const projectPath = this.projectState.currentFolderPath();
      if (!projectPath) return;

      const tree = await invoke<FileNode>("read_project_dir", {
        path: projectPath,
      });
      const chaptersNode = tree.children?.find(
        (c) => c.name === "chapters" && c.is_dir
      );

      if (chaptersNode) {
        this.chaptersFolderExists.set(true);

        // Load metadata
        let metadata: ChapterMetadata = { orders: {}, groups: {} };
        const metadataPath = `${chaptersNode.path}/chapters.json`;
        try {
          const content = await invoke<string>("read_file_content", {
            path: metadataPath,
          });
          const parsed = JSON.parse(content);
          // Migration or fallback
          if (Array.isArray(parsed.order)) {
            metadata.orders = { ".": parsed.order };
            metadata.groups = parsed.groups || {};
          } else {
            metadata = parsed;
          }
        } catch (e) {
          // Metadata doesn't exist or invalid, ignore
        }

        this.items.set(
          this.processNodes(chaptersNode.children || [], metadata, ".")
        );
      } else {
        this.chaptersFolderExists.set(false);
        this.items.set([]);
      }
    } catch (error) {
      console.error("Failed to load chapters:", error);
    } finally {
      this.loading.set(false);
    }
  }

  processNodes(
    nodes: FileNode[],
    metadata: ChapterMetadata,
    relativePath: string
  ): ChapterItem[] {
    // Filter out chapters.json
    const filteredNodes = nodes.filter((n) => n.name !== "chapters.json");

    // Map to items
    const items: ChapterItem[] = filteredNodes.map((node) => {
      const nodeRelativePath =
        relativePath === "." ? node.name : `${relativePath}/${node.name}`;
      return {
        id: node.path,
        type: node.is_dir ? "group" : "file",
        name: node.name,
        path: node.path,
        children: node.children
          ? this.processNodes(node.children, metadata, nodeRelativePath)
          : [],
        expanded: metadata.groups[node.path]?.expanded ?? false, // Use path as key for uniqueness
        selected: false,
      };
    });

    // Sort based on metadata.orders[relativePath]
    const orderList = metadata.orders[relativePath] || [];
    const orderMap = new Map(orderList.map((name, index) => [name, index]));

    items.sort((a, b) => {
      const indexA = orderMap.has(a.name) ? orderMap.get(a.name)! : -1;
      const indexB = orderMap.has(b.name) ? orderMap.get(b.name)! : -1;

      if (indexA === -1 && indexB === -1) {
        return a.name.localeCompare(b.name);
      }

      if (indexA === -1) return -1; // a is new, so it goes to top
      if (indexB === -1) return 1; // b is new, so it goes to top

      return indexA - indexB;
    });

    return items;
  }

  async saveMetadata() {
    const projectPath = this.projectState.currentFolderPath();
    if (!projectPath) return;

    const separator = projectPath.includes("\\") ? "\\" : "/";
    const chaptersPath = `${projectPath}${separator}chapters`;
    const metadataPath = `${chaptersPath}${separator}chapters.json`;

    const metadata: ChapterMetadata = {
      orders: {},
      groups: {},
    };

    const traverse = (items: ChapterItem[], relativePath: string) => {
      metadata.orders[relativePath] = items.map((i) => i.name);

      items.forEach((item) => {
        if (item.type === "group") {
          metadata.groups[item.path] = { expanded: item.expanded || false };
          if (item.children) {
            const nodeRelativePath =
              relativePath === "." ? item.name : `${relativePath}/${item.name}`;
            traverse(item.children, nodeRelativePath);
          }
        }
      });
    };

    traverse(this.items(), ".");

    try {
      await invoke("save_file_content", {
        path: metadataPath,
        content: JSON.stringify(metadata, null, 2),
      });
    } catch (error) {
      console.error("Failed to save metadata:", error);
    }
  }

  async createChaptersFolder() {
    const projectPath = this.projectState.currentFolderPath();
    if (!projectPath) return;

    const separator = projectPath.includes("\\") ? "\\" : "/";
    const chaptersPath = `${projectPath}${separator}chapters`;

    try {
      await invoke("create_folder", { path: chaptersPath });
      await this.loadChapters();
    } catch (error) {
      console.error("Failed to create chapters folder:", error);
    }
  }

  async createNewChapter() {
    if (!this.chaptersFolderExists()) await this.createChaptersFolder();

    const projectPath = this.projectState.currentFolderPath();
    const separator = projectPath.includes("\\") ? "\\" : "/";
    const chaptersPath = `${projectPath}${separator}chapters`;

    // Generate unique name
    let name = "Untitled.md";
    let counter = 1;
    // Check if exists in current items (shallow check)
    while (this.items().some((i) => i.name === name)) {
      name = `Untitled ${counter}.md`;
      counter++;
    }

    const filePath = `${chaptersPath}${separator}${name}`;

    try {
      await invoke("save_file_content", {
        path: filePath,
        content: "# New Chapter\n",
      });
      await this.loadChapters();

      // Save metadata to ensure order is preserved (new item at top)
      await this.saveMetadata();

      const newItem = this.items().find((i) => i.path === filePath);
      if (newItem) {
        this.startRename(newItem);
      }
    } catch (error) {
      console.error("Failed to create chapter:", error);
    }
  }

  async createNewGroup() {
    if (!this.chaptersFolderExists()) await this.createChaptersFolder();

    const projectPath = this.projectState.currentFolderPath();
    const separator = projectPath.includes("\\") ? "\\" : "/";
    const chaptersPath = `${projectPath}${separator}chapters`;

    let name = "New Group";
    let counter = 1;
    while (this.items().some((i) => i.name === name)) {
      name = `New Group ${counter}`;
      counter++;
    }

    const folderPath = `${chaptersPath}${separator}${name}`;

    try {
      await invoke("create_folder", { path: folderPath });
      await this.loadChapters();
      await this.saveMetadata();

      const newItem = this.items().find((i) => i.path === folderPath);
      if (newItem) {
        this.startRename(newItem);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  }

  selectItem(item: ChapterItem, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      item.selected = !item.selected;
    } else if (event.shiftKey) {
      // Range selection (simplified for now)
      item.selected = true;
    } else {
      // Single selection
      this.clearSelection();
      item.selected = true;
    }
  }

  clearSelection() {
    const clear = (items: ChapterItem[]) => {
      items.forEach((i) => {
        i.selected = false;
        if (i.children) clear(i.children);
      });
    };
    clear(this.items());
  }

  toggleGroup(item: ChapterItem) {
    if (item.type === "group") {
      item.expanded = !item.expanded;
      this.saveMetadata();
    }
  }

  openItem(item: ChapterItem) {
    if (item.type === "file") {
      this.projectState.openFile(item.path);
    }
  }

  startRename(item: ChapterItem) {
    this.renamingId.set(item.id);
  }

  async confirmRename(item: ChapterItem, newName: string) {
    if (!newName || newName === item.name) {
      this.cancelRename();
      return;
    }

    const parentPath = item.path.substring(
      0,
      item.path.lastIndexOf(item.path.includes("\\") ? "\\" : "/")
    );
    const separator = item.path.includes("\\") ? "\\" : "/";
    const newPath = `${parentPath}${separator}${newName}`;

    try {
      await invoke("rename_item", { oldPath: item.path, newPath });
      this.cancelRename();
      await this.loadChapters();
      await this.saveMetadata();
    } catch (error) {
      console.error("Failed to rename:", error);
    }
  }

  cancelRename() {
    this.renamingId.set(null);
  }

  async deleteItem(item: ChapterItem) {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      await invoke("delete_file", { path: item.path });
      await this.loadChapters();
      await this.saveMetadata();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  }

  // Drag and Drop
  onDragStart(event: DragEvent, item: ChapterItem, parent: ChapterItem | null) {
    this.draggedItem = item;
    this.draggedItemParent = parent;
    event.dataTransfer?.setData("text/plain", item.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  onDragOver(event: DragEvent, targetItem: ChapterItem) {
    event.preventDefault();
    // Add visual feedback
  }

  async onDrop(
    event: DragEvent,
    targetItem: ChapterItem,
    targetParent: ChapterItem | null
  ) {
    event.preventDefault();
    if (!this.draggedItem || this.draggedItem.id === targetItem.id) return;

    // If dropping onto a group, move into it
    if (targetItem.type === "group" && this.draggedItemParent !== targetItem) {
      const separator = targetItem.path.includes("\\") ? "\\" : "/";
      const newPath = `${targetItem.path}${separator}${this.draggedItem.name}`;
      try {
        await invoke("rename_item", {
          oldPath: this.draggedItem.path,
          newPath,
        });
        await this.loadChapters();
        await this.saveMetadata();
      } catch (error) {
        console.error("Failed to move item:", error);
      }
    } else {
      // Reordering within the same list
      // We need to find the list containing draggedItem and targetItem
      // If they are in different lists (different parents), we might need to move first

      if (this.draggedItemParent?.id !== targetParent?.id) {
        // Moving to a different folder/level
        // First move the file physically
        // Then reorder
        // For simplicity, let's just move it to the target folder first
        // But wait, if targetParent is null, it's root.

        const targetFolder = targetParent
          ? targetParent.path
          : this.items()[0]?.path.split(/[/\\]/).slice(0, -1).join("/") || "";
        // Actually we can get target folder from targetItem path
        const separator = targetItem.path.includes("\\") ? "\\" : "/";
        const targetFolderPath = targetItem.path.substring(
          0,
          targetItem.path.lastIndexOf(separator)
        );

        const newPath = `${targetFolderPath}${separator}${this.draggedItem.name}`;

        try {
          await invoke("rename_item", {
            oldPath: this.draggedItem.path,
            newPath,
          });
          // After move, we need to reload to get new paths, then we can reorder?
          // Or we can just reload and let the user reorder again.
          // Better: reload, then find the items and swap.
          await this.loadChapters();
          // Reordering logic after move is complex because IDs change.
          // Let's just stop here for cross-folder drop.
          await this.saveMetadata();
          return;
        } catch (error) {
          console.error("Failed to move item:", error);
          return;
        }
      }

      // Same parent reordering
      const list = targetParent ? targetParent.children! : this.items();

      // We need to modify the list in place or create new list
      // Since 'list' is a reference to the object in items(), modifying it might work if we trigger update
      // But items() is a signal. We need to update the signal.

      const draggedIndex = list.findIndex((i) => i.id === this.draggedItem!.id);
      const targetIndex = list.findIndex((i) => i.id === targetItem.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const item = list.splice(draggedIndex, 1)[0];
        list.splice(targetIndex, 0, item);

        // Trigger signal update
        this.items.update((items) => [...items]);
        await this.saveMetadata();
      }
    }

    this.draggedItem = null;
    this.draggedItemParent = null;
  }
}
