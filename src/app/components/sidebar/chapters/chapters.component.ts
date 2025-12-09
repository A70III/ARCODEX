import { Component, inject, signal, OnInit, computed } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import {
  ChaptersService,
  ChapterItem,
  ChapterGroup,
} from "../../../services/chapters.service";
import { ProjectStateService } from "../../../services/project-state.service";

@Component({
  selector: "app-chapters",
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-secondary)]">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-2 text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase"
      >
        <span>รายชื่อตอน</span>
        @if (chaptersService.configValid()) {
        <div class="flex items-center gap-1">
          @if (selectedChapters().size > 1) {
          <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--accent)]"
            title="จัดกลุ่มที่เลือก"
            (click)="groupSelected()"
          >
            <span class="material-icons text-base">folder</span>
          </button>
          }
          <button
            class="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-primary)]"
            title="เพิ่มตอนใหม่"
            (click)="startAddChapter()"
          >
            <span class="material-icons text-base">add</span>
          </button>
        </div>
        }
      </div>

      <!-- Add Chapter Input -->
      @if (isAdding()) {
      <div class="px-3 pb-3">
        <div class="flex items-center gap-2">
          <input
            #addInput
            type="text"
            class="flex-1 bg-[var(--bg-hover)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-2 py-1.5 rounded outline-none"
            placeholder="ชื่อตอน..."
            [(ngModel)]="newChapterName"
            (keydown.enter)="confirmAddChapter()"
            (keydown.escape)="cancelAdd()"
            (blur)="onAddInputBlur()"
          />
        </div>
      </div>
      }

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-2">
        @if (!projectState.currentFolderPath()) {
        <!-- No project opened -->
        <div
          class="flex flex-col items-center justify-center py-8 text-center px-4"
        >
          <span class="material-icons text-4xl text-[var(--border-color)] mb-3"
            >menu_book</span
          >
          <p class="text-[var(--text-secondary)] text-sm">
            กรุณาเปิดโปรเจคก่อน
          </p>
        </div>
        } @else if (chaptersService.loading()) {
        <!-- Loading -->
        <div class="flex items-center justify-center py-8">
          <span
            class="material-icons text-2xl text-[var(--text-secondary)] animate-spin"
            >autorenew</span
          >
        </div>
        } @else if (!chaptersService.configValid()) {
        <!-- Invalid config -->
        <div
          class="flex flex-col items-center justify-center py-8 text-center px-4"
        >
          <span class="material-icons text-4xl text-[var(--warning)] mb-3"
            >warning</span
          >
          <p class="text-[var(--text-secondary)] text-sm">
            {{ chaptersService.error() }}
          </p>
          <p class="text-[var(--text-muted)] text-xs mt-2">
            โปรเจคนี้ไม่มีไฟล์ config.arc ที่ถูกต้อง
          </p>
        </div>
        } @else if (allChapters().length === 0) {
        <!-- No chapters -->
        <div
          class="flex flex-col items-center justify-center py-8 text-center px-4"
        >
          <span class="material-icons text-4xl text-[var(--border-color)] mb-3"
            >article</span
          >
          <p class="text-[var(--text-secondary)] text-sm">ไม่มีตอนใดๆ</p>
          <button
            class="mt-4 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] text-sm rounded transition-colors"
            (click)="startAddChapter()"
          >
            เพิ่มตอน
          </button>
        </div>
        } @else {
        <!-- Chapter Groups -->
        @for (group of chaptersService.groupedChapters(); track group.id) {
        <div class="mb-2">
          <!-- Group Header -->
          <div
            class="flex items-center gap-1 py-1.5 px-2 cursor-pointer hover:bg-[var(--bg-hover)] rounded-sm group"
            [class.bg-[var(--bg-hover)]]="selectedGroups().has(group.id)"
            (click)="toggleGroupExpanded(group.id)"
            (contextmenu)="onGroupContextMenu($event, group)"
          >
            <span class="material-icons text-sm text-[var(--text-primary)]">
              {{ group.expanded ? "expand_more" : "chevron_right" }}
            </span>
            <span class="material-icons text-base text-[var(--warning)]"
              >folder</span
            >
            @if (editingGroupId() === group.id) {
            <input
              type="text"
              class="flex-1 bg-[var(--bg-hover)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-1 rounded outline-none"
              [value]="group.name"
              (keydown.enter)="confirmRenameGroup($event, group.id)"
              (keydown.escape)="cancelRenameGroup()"
              (blur)="cancelRenameGroup()"
              (click)="$event.stopPropagation()"
            />
            } @else {
            <span
              class="text-sm font-medium text-[var(--text-primary)] truncate flex-1"
              >{{ group.name }}</span
            >
            }
            <span class="text-xs text-[var(--text-secondary)]">{{
              group.chapters.length
            }}</span>
          </div>

          <!-- Group Chapters -->
          @if (group.expanded) {
          <div class="ml-4">
            @for (chapter of group.chapters; track chapter.path; let i = $index)
            {
            <ng-container
              *ngTemplateOutlet="
                chapterItem;
                context: {
                  $implicit: chapter,
                  inGroup: true,
                  first: i === 0,
                  last: i === group.chapters.length - 1
                }
              "
            ></ng-container>
            }
          </div>
          }
        </div>
        }

        <!-- Ungrouped Chapters -->
        @for (chapter of chaptersService.ungroupedChapters(); track
        chapter.path; let i = $index) {
        <ng-container
          *ngTemplateOutlet="
            chapterItem;
            context: {
              $implicit: chapter,
              inGroup: false,
              first: i === 0,
              last: i === chaptersService.ungroupedChapters().length - 1
            }
          "
        ></ng-container>
        } }
      </div>

      <!-- Selection Actions Bar -->
      @if (selectedChapters().size > 1) {
      <div
        class="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover)] border-t border-[var(--border-color)]"
      >
        <span class="text-xs text-[var(--text-secondary)]"
          >เลือก {{ selectedChapters().size }} ตอน</span
        >
        <div class="flex items-center gap-1">
          <button
            class="px-2 py-1 text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded"
            (click)="groupSelected()"
          >
            จัดกลุ่ม
          </button>
          <button
            class="px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            (click)="clearSelection()"
          >
            ยกเลิก
          </button>
        </div>
      </div>
      }

      <!-- Chapter Item Template -->
      <ng-template
        #chapterItem
        let-chapter
        let-inGroup="inGroup"
        let-first="first"
        let-last="last"
      >
        <div
          class="flex items-center gap-1 py-1.5 px-2 cursor-pointer hover:bg-[var(--bg-hover)] rounded-sm group border-l-2 transition-all"
          [class.border-[var(--accent)]]="selectedChapters().has(chapter.path)"
          [class.border-transparent]="!selectedChapters().has(chapter.path)"
          [class.bg-[var(--bg-hover)]]="selectedChapters().has(chapter.path)"
          (click)="onChapterClick($event, chapter)"
          (dblclick)="openChapter(chapter)"
          (contextmenu)="onChapterContextMenu($event, chapter)"
        >
          <!-- Up/Down arrows -->
          <div
            class="flex flex-row opacity-0 group-hover:opacity-100 transition-opacity compact"
          >
            <button
              class="p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
              [disabled]="first"
              title="ย้ายขึ้น"
              (click)="moveUp($event, chapter)"
            >
              <span class="material-icons text-sm">keyboard_arrow_up</span>
            </button>
            <button
              class="p-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
              [disabled]="last"
              title="ย้ายลง"
              (click)="moveDown($event, chapter)"
            >
              <span class="material-icons text-sm">keyboard_arrow_down</span>
            </button>
          </div>

          <span class="material-icons text-base text-[var(--info)]"
            >description</span
          >

          @if (editingPath() === chapter.path) {
          <input
            type="text"
            class="flex-1 bg-[var(--bg-hover)] border border-[var(--accent)] text-[var(--text-primary)] text-sm px-1 rounded outline-none"
            [value]="chapter.name"
            (keydown.enter)="confirmRename($event, chapter)"
            (keydown.escape)="cancelRename()"
            (blur)="cancelRename()"
            (click)="$event.stopPropagation()"
          />
          } @else {
          <span class="text-sm text-[var(--text-primary)] truncate flex-1">{{
            chapter.name
          }}</span>
          }

          <!-- Action buttons on hover -->
          <div
            class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              class="p-0.5 hover:bg-[var(--bg-active)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="แก้ไขชื่อ"
              (click)="startRename($event, chapter)"
            >
              <span class="material-icons text-sm">edit</span>
            </button>
            <button
              class="p-0.5 hover:bg-[var(--bg-active)] rounded text-[var(--text-secondary)] hover:text-[var(--error)]"
              title="ลบ"
              (click)="requestDeleteChapter($event, chapter)"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </ng-template>

      <!-- Context Menu -->
      @if (contextMenu().visible) {
      <div
        class="fixed bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-lg z-[1000] py-1 min-w-[160px]"
        [style.left.px]="contextMenu().x"
        [style.top.px]="contextMenu().y"
        (click)="$event.stopPropagation()"
      >
        @if (contextMenu().type === 'chapter') {
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="contextMenuAction('open')"
        >
          <span class="material-icons text-base">open_in_new</span>
          เปิด
        </button>
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="contextMenuAction('rename')"
        >
          <span class="material-icons text-base">edit</span>
          แก้ไขชื่อ
        </button>
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="contextMenuAction('delete')"
        >
          <span class="material-icons text-base text-[var(--error)]"
            >delete</span
          >
          ลบ
        </button>
        <div class="border-t border-[var(--border-color)] my-1"></div>
        @if (contextMenu().chapter?.groupId) {
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="contextMenuAction('ungroup')"
        >
          <span class="material-icons text-base">folder_off</span>
          ยกเลิกการจัดกลุ่ม
        </button>
        } } @else if (contextMenu().type === 'group') {
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="contextMenuAction('renameGroup')"
        >
          <span class="material-icons text-base">edit</span>
          แก้ไขชื่อกลุ่ม
        </button>
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-active)] text-left"
          (click)="contextMenuAction('deleteGroup')"
        >
          <span class="material-icons text-base text-[var(--error)]"
            >delete</span
          >
          ลบกลุ่ม
        </button>
        }
      </div>
      }

      <!-- Group Name Dialog -->
      @if (showGroupDialog()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]"
        (click)="cancelGroupDialog()"
      >
        <div
          class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 w-80 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-sm font-medium text-[var(--text-primary)] mb-3">
            ตั้งชื่อกลุ่ม
          </h3>
          <input
            type="text"
            class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm px-3 py-2 rounded outline-none focus:border-[var(--accent)]"
            placeholder="เช่น เล่ม 1, องค์แรก..."
            [(ngModel)]="groupName"
            (keydown.enter)="confirmGroupDialog()"
            (keydown.escape)="cancelGroupDialog()"
          />
          <div class="flex justify-end gap-2 mt-4">
            <button
              class="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              (click)="cancelGroupDialog()"
            >
              ยกเลิก
            </button>
            <button
              class="px-3 py-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded"
              (click)="confirmGroupDialog()"
            >
              สร้างกลุ่ม
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class ChaptersComponent implements OnInit {
  chaptersService = inject(ChaptersService);
  projectState = inject(ProjectStateService);

  // UI State
  isAdding = signal(false);
  newChapterName = "";
  editingPath = signal<string | null>(null);
  editingGroupId = signal<string | null>(null);

  // Selection state
  selectedChapters = signal<Set<string>>(new Set());
  selectedGroups = signal<Set<string>>(new Set());
  lastSelectedPath = signal<string | null>(null);

  // Context menu state
  contextMenu = signal<{
    visible: boolean;
    x: number;
    y: number;
    type: "chapter" | "group";
    chapter?: ChapterItem;
    group?: ChapterGroup;
  }>({ visible: false, x: 0, y: 0, type: "chapter" });

  // Group dialog state
  showGroupDialog = signal(false);
  groupName = "";

  // Computed
  allChapters = computed(() => this.chaptersService.chapters());

  constructor() {
    // Close context menu on click elsewhere
    document.addEventListener("click", () => {
      this.contextMenu.set({ visible: false, x: 0, y: 0, type: "chapter" });
    });
  }

  ngOnInit(): void {
    // Load chapters when project is opened
    if (this.projectState.currentFolderPath()) {
      this.chaptersService.loadChapters();
    }
  }

  // === Add Chapter ===
  startAddChapter(): void {
    this.isAdding.set(true);
    this.newChapterName = "";
    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="ชื่อตอน..."]'
      ) as HTMLInputElement;
      input?.focus();
    }, 0);
  }

  async confirmAddChapter(): Promise<void> {
    if (this.newChapterName.trim()) {
      await this.chaptersService.createChapter(this.newChapterName);
    }
    this.cancelAdd();
  }

  cancelAdd(): void {
    this.isAdding.set(false);
    this.newChapterName = "";
  }

  onAddInputBlur(): void {
    setTimeout(() => {
      if (this.isAdding()) {
        this.cancelAdd();
      }
    }, 150);
  }

  // === Rename Chapter ===
  startRename(event: Event, chapter: ChapterItem): void {
    event.stopPropagation();
    this.editingPath.set(chapter.path);
    setTimeout(() => {
      const input = document.querySelector(
        `input[value="${chapter.name}"]`
      ) as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  async confirmRename(event: Event, chapter: ChapterItem): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    if (newName && newName !== chapter.name) {
      await this.chaptersService.renameChapter(chapter.path, newName);
    }
    this.cancelRename();
  }

  cancelRename(): void {
    this.editingPath.set(null);
  }

  // === Delete Chapter ===
  requestDeleteChapter(event: Event, chapter: ChapterItem): void {
    event.stopPropagation();
    this.projectState.confirmationState.set({
      title: 'ลบตอน',
      message: `ต้องการลบ "${chapter.name}" หรือไม่?`,
      onConfirm: async () => {
        await this.chaptersService.deleteChapter(chapter.path);
        this.projectState.confirmationState.set(null);
      }
    });
  }

  // === Open Chapter ===
  openChapter(chapter: ChapterItem): void {
    this.chaptersService.openChapter(chapter.path);
  }

  // === Move Up/Down ===
  async moveUp(event: Event, chapter: ChapterItem): Promise<void> {
    event.stopPropagation();
    await this.chaptersService.moveChapterUp(chapter.path);
  }

  async moveDown(event: Event, chapter: ChapterItem): Promise<void> {
    event.stopPropagation();
    await this.chaptersService.moveChapterDown(chapter.path);
  }

  // === Selection ===
  onChapterClick(event: MouseEvent, chapter: ChapterItem): void {
    if (event.shiftKey && this.lastSelectedPath()) {
      // Range selection
      const chapters = this.chaptersService.chapters();
      const lastIndex = chapters.findIndex(
        (c) => c.path === this.lastSelectedPath()
      );
      const currentIndex = chapters.findIndex((c) => c.path === chapter.path);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);

        const newSelection = new Set(this.selectedChapters());
        for (let i = start; i <= end; i++) {
          newSelection.add(chapters[i].path);
        }
        this.selectedChapters.set(newSelection);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      const newSelection = new Set(this.selectedChapters());
      if (newSelection.has(chapter.path)) {
        newSelection.delete(chapter.path);
      } else {
        newSelection.add(chapter.path);
      }
      this.selectedChapters.set(newSelection);
      this.lastSelectedPath.set(chapter.path);
    } else {
      // Single selection
      this.selectedChapters.set(new Set([chapter.path]));
      this.lastSelectedPath.set(chapter.path);
    }
  }

  clearSelection(): void {
    this.selectedChapters.set(new Set());
    this.lastSelectedPath.set(null);
  }

  // === Grouping ===
  groupSelected(): void {
    if (this.selectedChapters().size > 1) {
      this.groupName = "";
      this.showGroupDialog.set(true);
      setTimeout(() => {
        const input = document.querySelector(
          'input[placeholder*="เล่ม"]'
        ) as HTMLInputElement;
        input?.focus();
      }, 0);
    }
  }

  async confirmGroupDialog(): Promise<void> {
    if (this.groupName.trim()) {
      await this.chaptersService.createGroup(
        Array.from(this.selectedChapters()),
        this.groupName.trim()
      );
      this.clearSelection();
    }
    this.cancelGroupDialog();
  }

  cancelGroupDialog(): void {
    this.showGroupDialog.set(false);
    this.groupName = "";
  }

  toggleGroupExpanded(groupId: string): void {
    this.chaptersService.toggleGroupExpanded(groupId);
  }

  // === Group Rename ===
  startRenameGroup(group: ChapterGroup): void {
    this.editingGroupId.set(group.id);
  }

  async confirmRenameGroup(event: Event, groupId: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    if (newName) {
      await this.chaptersService.renameGroup(groupId, newName);
    }
    this.cancelRenameGroup();
  }

  cancelRenameGroup(): void {
    this.editingGroupId.set(null);
  }

  // === Context Menu ===
  onChapterContextMenu(event: MouseEvent, chapter: ChapterItem): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: "chapter",
      chapter,
    });
  }

  onGroupContextMenu(event: MouseEvent, group: ChapterGroup): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: "group",
      group,
    });
  }

  async contextMenuAction(action: string): Promise<void> {
    const menu = this.contextMenu();
    this.contextMenu.set({ visible: false, x: 0, y: 0, type: "chapter" });

    switch (action) {
      case "open":
        if (menu.chapter) this.openChapter(menu.chapter);
        break;
      case "rename":
        if (menu.chapter)
          this.startRename({ stopPropagation: () => {} } as any, menu.chapter);
        break;
      case "delete":
        if (menu.chapter) {
          this.projectState.confirmationState.set({
            title: 'ลบตอน',
            message: `ต้องการลบ "${menu.chapter.name}" หรือไม่?`,
            onConfirm: async () => {
              await this.chaptersService.deleteChapter(menu.chapter!.path);
              this.projectState.confirmationState.set(null);
            }
          });
        }
        break;
      case "ungroup":
        if (menu.chapter) {
          await this.chaptersService.ungroupChapter(menu.chapter.path);
        }
        break;
      case "renameGroup":
        if (menu.group) this.startRenameGroup(menu.group);
        break;
      case "deleteGroup":
        if (menu.group) {
          this.projectState.confirmationState.set({
            title: 'ลบกลุ่ม',
            message: `ต้องการลบกลุ่ม "${menu.group.name}" หรือไม่? (ตอนในกลุ่มจะไม่ถูกลบ)`,
            onConfirm: async () => {
              await this.chaptersService.deleteGroup(menu.group!.id);
              this.projectState.confirmationState.set(null);
            }
          });
        }
        break;
    }
  }
}
