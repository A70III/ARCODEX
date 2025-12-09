import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center select-none">
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-2xl rounded-md min-w-[350px] max-w-[500px]">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <span class="text-[var(--text-primary)] font-medium">{{ title }}</span>
          <button class="text-[var(--text-secondary)] hover:text-[var(--text-inverse)]" (click)="onCancel()">
            <span class="material-icons text-base">close</span>
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-4 text-[var(--text-primary)] text-sm flex items-start gap-4">
          <span class="material-icons text-[var(--accent)] text-3xl mt-1">help_outline</span>
          <div class="mt-1">
             <p>{{ message }}</p>
             <p class="text-[var(--text-secondary)] text-xs mt-2">This action cannot be undone.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-4 py-3 bg-[var(--bg-primary)] border-t border-[var(--border-color)] rounded-b-md">
           <button 
             class="px-4 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--bg-hover)] hover:bg-[var(--border-light)] border border-[var(--border-light)] rounded transition-colors"
             (click)="onCancel()"
           >
             Cancel
           </button>
           <button 
             class="px-4 py-1.5 text-xs text-[var(--text-inverse)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] border border-[var(--accent)] rounded transition-colors"
             (click)="onConfirm()"
           >
             Yes, Delete
           </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmationModalComponent {
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure?';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
