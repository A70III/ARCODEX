import { Component, inject, signal, OnInit, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CodexService } from "../../../services/codex.service";
import { ProjectStateService } from "../../../services/project-state.service";

@Component({
  selector: "app-codex-library",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-primary)]">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]"
      >
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-[var(--accent)]"
            >menu_book</span
          >
          <h1 class="text-xl font-semibold text-[var(--text-primary)]">
            Codex Library
          </h1>
        </div>
        
        <!-- Project Info -->
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-1.5">
            <span class="text-[var(--text-secondary)]">ชื่อเรื่อง:</span>
            <span class="text-[var(--text-primary)] font-medium">{{ codexService.projectTitle() || '-' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[var(--text-secondary)]">ผู้เขียน:</span>
            <span class="text-[var(--text-primary)]">{{ codexService.projectAuthor() || '-' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[var(--text-secondary)]">ประเภท:</span>
            <span class="text-[var(--text-primary)]">{{ codexService.getGenreLabel(codexService.projectGenre()) || '-' }}</span>
          </div>
          <button
            class="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="แก้ไขข้อมูลโปรเจค"
            (click)="openEditProjectDialog()"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
        </div>
      </div>

      <!-- Submenu Tabs -->
      <div
        class="flex items-center gap-1 px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]"
      >
        <!-- All Tab -->
        <button
          class="px-4 py-2 text-sm rounded-md transition-colors"
          [class.bg-[var(--accent)]]="codexService.activeTab() === 'all'"
          [class.text-[var(--text-inverse)]]="codexService.activeTab() === 'all'"
          [class.text-[var(--text-secondary)]]="codexService.activeTab() !== 'all'"
          [class.hover:bg-[var(--bg-hover)]]="codexService.activeTab() !== 'all'"
          (click)="codexService.setActiveTab('all')"
        >
          ทั้งหมด
        </button>

        <!-- Dynamic Folder Tabs -->
        @for (item of codexService.submenuItems(); track item.folder) {
        <button
          class="px-4 py-2 text-sm rounded-md transition-colors"
          [class.bg-[var(--accent)]]="codexService.activeTab() === item.folder"
          [class.text-[var(--text-inverse)]]="codexService.activeTab() === item.folder"
          [class.text-[var(--text-secondary)]]="codexService.activeTab() !== item.folder"
          [class.hover:bg-[var(--bg-hover)]]="codexService.activeTab() !== item.folder"
          (click)="codexService.setActiveTab(item.folder)"
        >
          {{ item.label }}
        </button>
        }

        <!-- Add Folder Button -->
        <button
          class="p-2 ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
          title="เพิ่มหมวดหมู่ใหม่"
          (click)="openAddCategoryDialog()"
        >
          <span class="material-icons text-lg">add</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6">
        @if (codexService.loading()) {
        <div class="flex items-center justify-center py-16">
          <span
            class="material-icons text-3xl text-[var(--text-secondary)] animate-spin"
            >autorenew</span
          >
        </div>
        } @else if (codexService.submenuItems().length === 0) {
        <!-- Empty State -->
        <div
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <span class="material-icons text-6xl text-[var(--border-color)] mb-4"
            >library_books</span
          >
          <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">
            ยังไม่มีข้อมูลใน Codex
          </h3>
          <p class="text-[var(--text-secondary)] text-sm mb-6 max-w-md">
            เริ่มต้นสร้างหมวดหมู่ใหม่เพื่อจัดเก็บข้อมูลตัวละคร สถานที่ พลัง
            หรือข้อมูลอื่นๆ ในโลกของคุณ
          </p>
          <button
            class="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded-lg transition-colors flex items-center gap-2"
            (click)="openAddCategoryDialog()"
          >
            <span class="material-icons">add</span>
            สร้างหมวดหมู่ใหม่
          </button>
        </div>
        } @else {
        <!-- Content Grid -->
        <div class="text-[var(--text-secondary)] text-center py-8">
          <p>แสดงรายการของ: {{ getActiveTabLabel() }}</p>
          <p class="text-sm mt-2">
            (ฟีเจอร์แสดงรายการข้อมูลจะพัฒนาต่อไป)
          </p>
        </div>
        }
      </div>

      <!-- Add Category Dialog -->
      @if (showAddDialog()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]"
        (click)="cancelAddDialog()"
      >
        <div
          class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5 w-96 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-base font-medium text-[var(--text-primary)] mb-4">
            สร้างหมวดหมู่ใหม่
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1.5">
                ชื่อโฟลเดอร์ (ภาษาอังกฤษ)
              </label>
              <input
                type="text"
                class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm px-3 py-2 rounded outline-none focus:border-[var(--accent)]"
                placeholder="เช่น characters, places, items..."
                [(ngModel)]="newFolderName"
                (keydown.enter)="confirmAddCategory()"
                (keydown.escape)="cancelAddDialog()"
              />
            </div>
            
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1.5">
                ชื่อที่แสดง (ภาษาไทย)
              </label>
              <input
                type="text"
                class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm px-3 py-2 rounded outline-none focus:border-[var(--accent)]"
                placeholder="เช่น ตัวละคร, สถานที่, ไอเทม..."
                [(ngModel)]="newDisplayName"
                (keydown.enter)="confirmAddCategory()"
                (keydown.escape)="cancelAddDialog()"
              />
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-5">
            <button
              class="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              (click)="cancelAddDialog()"
            >
              ยกเลิก
            </button>
            <button
              class="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded"
              [disabled]="!newFolderName.trim() || !newDisplayName.trim()"
              [class.opacity-50]="!newFolderName.trim() || !newDisplayName.trim()"
              (click)="confirmAddCategory()"
            >
              สร้างหมวดหมู่
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Edit Project Dialog -->
      @if (showEditProjectDialog()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]"
        (click)="cancelEditProjectDialog()"
      >
        <div
          class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5 w-[450px] shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-base font-medium text-[var(--text-primary)] mb-4">
            แก้ไขข้อมูลโปรเจค
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1.5">
                ชื่อเรื่อง
              </label>
              <input
                type="text"
                class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm px-3 py-2 rounded outline-none focus:border-[var(--accent)]"
                [(ngModel)]="editTitle"
                (keydown.escape)="cancelEditProjectDialog()"
              />
            </div>
            
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1.5">
                ผู้เขียน
              </label>
              <input
                type="text"
                class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm px-3 py-2 rounded outline-none focus:border-[var(--accent)]"
                [(ngModel)]="editAuthor"
                (keydown.escape)="cancelEditProjectDialog()"
              />
            </div>
            
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1.5">
                ประเภท
              </label>
              <select
                class="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm px-3 py-2 rounded outline-none focus:border-[var(--accent)]"
                [(ngModel)]="editGenre"
              >
                @for (genre of genres; track genre.value) {
                <option [value]="genre.value">{{ genre.label }}</option>
                }
              </select>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-5">
            <button
              class="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              (click)="cancelEditProjectDialog()"
            >
              ยกเลิก
            </button>
            <button
              class="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] rounded"
              (click)="confirmEditProject()"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class CodexLibraryComponent implements OnInit {
  codexService = inject(CodexService);
  projectState = inject(ProjectStateService);

  // Add category dialog state
  showAddDialog = signal(false);
  newFolderName = "";
  newDisplayName = "";

  // Edit project dialog state
  showEditProjectDialog = signal(false);
  editTitle = "";
  editAuthor = "";
  editGenre = "";

  // Genre options (same as new-project-dialog)
  genres = [
    { value: 'romance', label: 'โรแมนติก / รักหวาน' },
    { value: 'fantasy', label: 'แฟนตาซี / ผจญภัย' },
    { value: 'wuxia', label: 'กำลังภายใน / จีนโบราณ' },
    { value: 'xianxia', label: 'เทพเซียน / บำเพ็ญเซียน' },
    { value: 'xuanhuan', label: 'เซวียนหวน / แฟนตาซีจีน' },
    { value: 'litrpg', label: 'LitRPG / เกมโลก' },
    { value: 'action', label: 'แอคชั่น / ต่อสู้' },
    { value: 'horror', label: 'สยองขวัญ / ลึกลับ' },
    { value: 'drama', label: 'ดราม่า / ชีวิต' },
    { value: 'comedy', label: 'ตลก / เบาสมอง' },
    { value: 'scifi', label: 'ไซไฟ / อนาคต' },
    { value: 'historical', label: 'ย้อนยุค / ประวัติศาสตร์' },
    { value: 'isekai', label: 'อิเซไก / ข้ามโลก' },
    { value: 'yaoi', label: 'วาย / บอยเลิฟ' },
    { value: 'yuri', label: 'ยูริ / เกิร์ลเลิฟ' },
    { value: 'mystery', label: 'สืบสวน / แก้ปริศนา' },
    { value: 'slice_of_life', label: 'Slice of Life / ชีวิตประจำวัน' },
    { value: 'other', label: 'อื่นๆ' },
  ];

  private lastLoadedPath: string | null = null;

  constructor() {
    // Reload codex when view becomes active
    effect(() => {
      const view = this.projectState.activeSidebarView();
      const currentPath = this.projectState.currentFolderPath();
      
      // Load only if view is active, path exists, and it's a new path or hasn't been loaded
      if (view === "codex" && currentPath && this.lastLoadedPath !== currentPath) {
        this.codexService.loadCodex();
        this.lastLoadedPath = currentPath;
      }
    });
  }

  ngOnInit(): void {
    if (this.projectState.currentFolderPath()) {
      this.codexService.loadCodex();
    }
  }

  getActiveTabLabel(): string {
    const tab = this.codexService.activeTab();
    if (tab === "all") return "ทั้งหมด";
    const item = this.codexService.submenuItems().find((i) => i.folder === tab);
    return item?.label || tab;
  }

  // Add Category Dialog
  openAddCategoryDialog(): void {
    this.newFolderName = "";
    this.newDisplayName = "";
    this.showAddDialog.set(true);
  }

  cancelAddDialog(): void {
    this.showAddDialog.set(false);
    this.newFolderName = "";
    this.newDisplayName = "";
  }

  async confirmAddCategory(): Promise<void> {
    const folderName = this.newFolderName.trim();
    const displayName = this.newDisplayName.trim();

    if (!folderName || !displayName) return;

    await this.codexService.createCategory(folderName, displayName);
    this.cancelAddDialog();
  }

  // Edit Project Dialog
  openEditProjectDialog(): void {
    this.editTitle = this.codexService.projectTitle();
    this.editAuthor = this.codexService.projectAuthor();
    this.editGenre = this.codexService.projectGenre();
    this.showEditProjectDialog.set(true);
  }

  cancelEditProjectDialog(): void {
    this.showEditProjectDialog.set(false);
  }

  async confirmEditProject(): Promise<void> {
    await this.codexService.updateProjectInfo(
      this.editTitle.trim(),
      this.editAuthor.trim(),
      this.editGenre
    );
    this.cancelEditProjectDialog();
  }
}
