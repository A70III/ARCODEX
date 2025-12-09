import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ThemeType } from '../../services/settings.service';

type SettingsPage = 'appearance' | 'editor' | 'shortcuts' | 'about';

interface ShortcutItem {
  label: string;
  key: string;
}

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center select-none" (click)="onBackdropClick($event)">
      <div class="bg-[#252526] border border-[#454545] shadow-2xl rounded-lg w-[650px] h-[500px] flex overflow-hidden" (click)="$event.stopPropagation()">
        
        <!-- Sidebar Navigation -->
        <div class="w-16 bg-[#1e1e1e] border-r border-[#3c3c3c] flex flex-col items-center py-4 gap-2">
          @for (page of pages; track page.id) {
            <button
              class="w-12 h-12 flex items-center justify-center rounded-lg transition-all"
              [class.bg-[#094771]]="currentPage() === page.id"
              [class.text-white]="currentPage() === page.id"
              [class.text-[#858585]]="currentPage() !== page.id"
              [class.hover:text-white]="currentPage() !== page.id"
              [class.hover:bg-[#3c3c3c]]="currentPage() !== page.id"
              (click)="setPage(page.id)"
              [title]="page.label"
            >
              <span class="material-icons text-2xl">{{ page.icon }}</span>
            </button>
          }
        </div>
        
        <!-- Content Area -->
        <div class="flex-1 flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3c]">
            <span class="text-[#cccccc] font-medium text-lg">{{ getCurrentPageLabel() }}</span>
            <button class="text-[#858585] hover:text-white p-1 rounded hover:bg-[#3c3c3c] transition-colors" (click)="close()">
              <span class="material-icons text-xl">close</span>
            </button>
          </div>
          
          <!-- Page Content -->
          <div class="flex-1 overflow-y-auto p-6">
            
            @switch (currentPage()) {
              <!-- Page 1: Appearance -->
              @case ('appearance') {
                <div class="space-y-6">
                  <!-- Theme -->
                  <div>
                    <label class="block text-[#cccccc] text-sm font-medium mb-3">ธีม</label>
                    <div class="grid grid-cols-5 gap-3">
                      @for (theme of settingsService.themes; track theme.id) {
                        <button
                          class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
                          [class.border-[#007acc]]="settingsService.settings().theme === theme.id"
                          [class.bg-[#094771]/30]="settingsService.settings().theme === theme.id"
                          [class.border-[#3c3c3c]]="settingsService.settings().theme !== theme.id"
                          [class.hover:border-[#555]]="settingsService.settings().theme !== theme.id"
                          (click)="settingsService.setTheme(theme.id)"
                        >
                          <div 
                            class="w-10 h-10 rounded-md border border-[#555]"
                            [style.background]="theme.colors.bg"
                          >
                            <div class="w-full h-1/2 rounded-t-md" [style.background]="theme.colors.bgSecondary"></div>
                          </div>
                          <span class="text-xs text-[#cccccc]">{{ theme.name }}</span>
                        </button>
                      }
                    </div>
                  </div>
                  
                  <!-- Font -->
                  <div>
                    <label class="block text-[#cccccc] text-sm font-medium mb-3">ฟอนต์ Editor</label>
                    <select 
                      class="w-full bg-[#3c3c3c] border border-[#555] rounded-md px-3 py-2 text-[#cccccc] text-sm focus:outline-none focus:border-[#007acc]"
                      [ngModel]="settingsService.settings().editorFont"
                      (ngModelChange)="settingsService.setFont($event)"
                    >
                      @for (font of settingsService.availableFonts; track font) {
                        <option [value]="font" [style.font-family]="font">{{ font }}</option>
                      }
                    </select>
                    <div class="mt-3 p-4 bg-[#1e1e1e] rounded-md border border-[#3c3c3c]">
                      <p 
                        class="text-[#cccccc]" 
                        [style.font-family]="settingsService.settings().editorFont"
                        [style.font-size.px]="settingsService.settings().editorFontSize"
                      >
                        ตัวอย่างข้อความ - Sample Text
                      </p>
                    </div>
                  </div>
                  
                  <!-- Font Size -->
                  <div>
                    <label class="block text-[#cccccc] text-sm font-medium mb-3">
                      ขนาดตัวอักษร: {{ settingsService.settings().editorFontSize }}px
                    </label>
                    <div class="flex items-center gap-4">
                      <span class="text-[#858585] text-xs">12px</span>
                      <input 
                        type="range" 
                        min="12" 
                        max="32" 
                        step="1"
                        class="flex-1 accent-[#007acc]"
                        [ngModel]="settingsService.settings().editorFontSize"
                        (ngModelChange)="settingsService.setFontSize($event)"
                      />
                      <span class="text-[#858585] text-xs">32px</span>
                    </div>
                  </div>
                </div>
              }
              
              <!-- Page 2: Editor -->
              @case ('editor') {
                <div class="space-y-6">
                  <!-- Auto Save -->
                  <div>
                    <label class="block text-[#cccccc] text-sm font-medium mb-3">บันทึกอัตโนมัติ</label>
                    <div class="flex items-center gap-3">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          class="sr-only peer"
                          [checked]="settingsService.settings().autoSaveInterval > 0"
                          (change)="toggleAutoSave($event)"
                        />
                        <div class="w-11 h-6 bg-[#3c3c3c] rounded-full peer peer-checked:bg-[#007acc] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      @if (settingsService.settings().autoSaveInterval > 0) {
                        <span class="text-[#cccccc] text-sm">ทุก</span>
                        <input 
                          type="number" 
                          min="5" 
                          max="300"
                          class="w-20 bg-[#3c3c3c] border border-[#555] rounded px-2 py-1 text-[#cccccc] text-sm text-center focus:outline-none focus:border-[#007acc]"
                          [ngModel]="settingsService.settings().autoSaveInterval"
                          (ngModelChange)="settingsService.setAutoSaveInterval($event)"
                        />
                        <span class="text-[#cccccc] text-sm">วินาที</span>
                      } @else {
                        <span class="text-[#858585] text-sm">ปิดใช้งาน</span>
                      }
                    </div>
                  </div>
                  
                  <!-- Show Line Numbers -->
                  <div>
                    <label class="block text-[#cccccc] text-sm font-medium mb-3">แสดงเลขบรรทัด</label>
                    <div class="flex items-center gap-3">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          class="sr-only peer"
                          [checked]="settingsService.settings().showLineNumbers"
                          (change)="settingsService.setShowLineNumbers(!settingsService.settings().showLineNumbers)"
                        />
                        <div class="w-11 h-6 bg-[#3c3c3c] rounded-full peer peer-checked:bg-[#007acc] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      <span class="text-[#858585] text-sm">
                        {{ settingsService.settings().showLineNumbers ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                      </span>
                    </div>
                  </div>
                </div>
              }
              
              <!-- Page 3: Shortcuts -->
              @case ('shortcuts') {
                <div class="space-y-3">
                  @for (shortcut of shortcuts; track shortcut.label) {
                    <div class="flex items-center justify-between py-2 border-b border-[#3c3c3c]">
                      <span class="text-[#cccccc] text-sm">{{ shortcut.label }}</span>
                      <kbd class="px-2 py-1 text-xs bg-[#3c3c3c] text-[#e0e0e0] rounded">{{ shortcut.key }}</kbd>
                    </div>
                  }
                </div>
              }
              
              <!-- Page 4: About -->
              @case ('about') {
                <div class="flex flex-col items-center justify-center h-full text-center">
                  <span class="material-icons text-7xl text-[#3c3c3c] mb-4">auto_stories</span>
                  <h1 class="text-2xl font-semibold text-[#cccccc] mb-2">Tales IDE</h1>
                  <p class="text-[#858585] mb-6">Your Creative Writing Companion</p>
                  
                  <div class="space-y-2 text-sm">
                    <div class="flex items-center justify-center gap-2">
                      <span class="text-[#858585]">เวอร์ชัน:</span>
                      <span class="text-[#cccccc]">0.1.0</span>
                    </div>
                    <div class="flex items-center justify-center gap-2">
                      <span class="text-[#858585]">ผู้พัฒนา:</span>
                      <span class="text-[#cccccc]">L2S</span>
                    </div>
                  </div>
                  
                  <div class="mt-8 text-xs text-[#6e6e6e]">
                    Built with Angular + Tauri
                  </div>
                </div>
              }
            }
            
          </div>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    input[type="range"] {
      -webkit-appearance: none;
      height: 6px;
      background: #3c3c3c;
      border-radius: 3px;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: #007acc;
      border-radius: 50%;
      cursor: pointer;
    }
    
    input[type="range"]::-webkit-slider-thumb:hover {
      background: #1c8ad4;
    }
  `]
})
export class SettingsDialogComponent {
  settingsService = inject(SettingsService);
  
  currentPage = signal<SettingsPage>('appearance');
  
  pages: { id: SettingsPage; icon: string; label: string }[] = [
    { id: 'appearance', icon: 'palette', label: 'ธีมและรูปลักษณ์' },
    { id: 'editor', icon: 'tune', label: 'การตั้งค่า Editor' },
    { id: 'shortcuts', icon: 'keyboard', label: 'ปุ่มลัด' },
    { id: 'about', icon: 'info', label: 'เกี่ยวกับ' },
  ];
  
  shortcuts: ShortcutItem[] = [
    { label: 'บันทึก', key: 'Ctrl+S' },
    { label: 'บันทึกทั้งหมด', key: 'Ctrl+Shift+S' },
    { label: 'ไฟล์ใหม่', key: 'Ctrl+N' },
    { label: 'โฟลเดอร์ใหม่', key: 'Ctrl+Shift+N' },
    { label: 'เปิดโฟลเดอร์', key: 'Ctrl+O' },
    { label: 'สลับ Sidebar', key: 'Ctrl+B' },
    { label: 'ตัวหนา', key: 'Ctrl+B' },
    { label: 'ตัวเอียง', key: 'Ctrl+I' },
    { label: 'ขีดเส้นใต้', key: 'Ctrl+U' },
    { label: 'ย้อนกลับ', key: 'Ctrl+Z' },
    { label: 'ทำซ้ำ', key: 'Ctrl+Y' },
  ];
  
  setPage(page: SettingsPage): void {
    this.currentPage.set(page);
  }
  
  getCurrentPageLabel(): string {
    const page = this.pages.find(p => p.id === this.currentPage());
    return page?.label || '';
  }
  
  close(): void {
    this.settingsService.closeDialog();
  }
  
  onBackdropClick(event: Event): void {
    this.close();
  }
  
  toggleAutoSave(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settingsService.setAutoSaveInterval(checked ? 30 : 0);
  }
}
