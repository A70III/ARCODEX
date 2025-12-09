import { Component, inject, signal, OnInit, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CodexService } from "../../services/codex.service";
import { ProjectStateService } from "../../services/project-state.service";

@Component({
  selector: "app-codex-library",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--bg-primary)]">
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]"
      >
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-[var(--accent)]"
            >auto_stories</span
          >
          <h1 class="text-xl font-semibold text-[var(--text-primary)]">
            Codex Library
          </h1>
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
    </div>
  `,
})
export class CodexLibraryComponent implements OnInit {
  codexService = inject(CodexService);
  projectState = inject(ProjectStateService);

  constructor() {
    // Reload codex when view becomes active
    effect(() => {
      const view = this.projectState.activeSidebarView();
      if (view === "codex" && this.projectState.currentFolderPath()) {
        this.codexService.loadCodex();
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
}
