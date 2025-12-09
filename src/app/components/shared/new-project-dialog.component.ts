import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectStateService } from '../../services/project-state.service';

export interface NewProjectData {
  title: string;
  author: string;
  genre: string;
  description: string;
}

@Component({
  selector: 'app-new-project-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center select-none" (click)="onBackdropClick($event)">
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-2xl rounded-lg w-[500px] overflow-hidden" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div class="flex items-center gap-3">
            <span class="material-icons text-[var(--accent)] text-2xl">auto_stories</span>
            <span class="text-[var(--text-primary)] font-medium text-lg">สร้างโปรเจคใหม่</span>
          </div>
          <button class="text-[var(--text-secondary)] hover:text-[var(--text-inverse)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors" (click)="close()">
            <span class="material-icons text-xl">close</span>
          </button>
        </div>
        
        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1.5">ชื่อเรื่อง *</label>
            <input 
              type="text" 
              class="w-full bg-[var(--bg-hover)] border border-[var(--border-light)] rounded-md px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              placeholder="เช่น บันทึกนภาไร้นาม"
              [(ngModel)]="formData.title"
            />
          </div>
          
          <!-- Author -->
          <div>
            <label class="block text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1.5">ชื่อผู้เขียน *</label>
            <input 
              type="text" 
              class="w-full bg-[var(--bg-hover)] border border-[var(--border-light)] rounded-md px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              placeholder="เช่น นามปากกา"
              [(ngModel)]="formData.author"
            />
          </div>
          
          <!-- Genre -->
          <div>
            <label class="block text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1.5">ประเภท *</label>
            <select 
              class="w-full bg-[var(--bg-hover)] border border-[var(--border-light)] rounded-md px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              [(ngModel)]="formData.genre"
            >
              <option value="">-- เลือกประเภท --</option>
              @for (genre of genres; track genre.value) {
                <option [value]="genre.value">{{ genre.label }}</option>
              }
            </select>
          </div>
          
          <!-- Description -->
          <div>
            <label class="block text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1.5">คำอธิบายเรื่อง</label>
            <textarea 
              class="w-full bg-[var(--bg-hover)] border border-[var(--border-light)] rounded-md px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
              rows="3"
              placeholder="คำอธิบายสั้นๆ เกี่ยวกับเนื้อเรื่อง..."
              [(ngModel)]="formData.description"
            ></textarea>
          </div>
          
          <!-- Error message -->
          @if (errorMessage()) {
            <div class="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)] rounded-md">
              <span class="material-icons text-[var(--error)] text-sm">error</span>
              <span class="text-[var(--error)] text-sm">{{ errorMessage() }}</span>
            </div>
          }
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
          <button 
            class="px-4 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-hover)] hover:bg-[var(--border-light)] border border-[var(--border-light)] rounded-md transition-colors"
            (click)="close()"
          >
            ยกเลิก
          </button>
          <button 
            class="px-4 py-2 text-sm text-[var(--text-inverse)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] border border-[var(--accent)] rounded-md transition-colors flex items-center gap-2"
            [disabled]="isCreating()"
            (click)="create()"
          >
            @if (isCreating()) {
              <span class="material-icons text-sm animate-spin">sync</span>
              กำลังสร้าง...
            } @else {
              <span class="material-icons text-sm">add</span>
              สร้างโปรเจค
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class NewProjectDialogComponent {
  projectState = inject(ProjectStateService);
  
  formData: NewProjectData = {
    title: '',
    author: '',
    genre: '',
    description: ''
  };
  
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
  
  isCreating = signal(false);
  errorMessage = signal('');
  
  close(): void {
    this.projectState.closeNewProjectDialog();
    this.resetForm();
  }
  
  onBackdropClick(event: Event): void {
    this.close();
  }
  
  async create(): Promise<void> {
    // Validate
    if (!this.formData.title.trim()) {
      this.errorMessage.set('กรุณากรอกชื่อเรื่อง');
      return;
    }
    if (!this.formData.author.trim()) {
      this.errorMessage.set('กรุณากรอกชื่อผู้เขียน');
      return;
    }
    if (!this.formData.genre) {
      this.errorMessage.set('กรุณาเลือกประเภทเรื่อง');
      return;
    }
    
    this.errorMessage.set('');
    this.isCreating.set(true);
    
    try {
      await this.projectState.createNewProject(this.formData);
      this.close();
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจค');
    } finally {
      this.isCreating.set(false);
    }
  }
  
  private resetForm(): void {
    this.formData = {
      title: '',
      author: '',
      genre: '',
      description: ''
    };
    this.errorMessage.set('');
  }
}
