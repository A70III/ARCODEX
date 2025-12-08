import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center select-none">
      <div class="bg-[#252526] border border-[#454545] shadow-2xl rounded-md min-w-[350px] max-w-[500px]">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c]">
          <span class="text-[#cccccc] font-medium">{{ title }}</span>
          <button class="text-[#858585] hover:text-white" (click)="onCancel()">
            <span class="material-icons text-base">close</span>
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-4 text-[#cccccc] text-sm flex items-start gap-4">
          <span class="material-icons text-[#007acc] text-3xl mt-1">help_outline</span>
          <div class="mt-1">
             <p>{{ message }}</p>
             <p class="text-[#858585] text-xs mt-2">This action cannot be undone.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-4 py-3 bg-[#1e1e1e] border-t border-[#3c3c3c] rounded-b-md">
           <button 
             class="px-4 py-1.5 text-xs text-[#cccccc] bg-[#3c3c3c] hover:bg-[#454545] border border-[#454545] rounded transition-colors"
             (click)="onCancel()"
           >
             Cancel
           </button>
           <button 
             class="px-4 py-1.5 text-xs text-white bg-[#007acc] hover:bg-[#0062a3] border border-[#007acc] rounded transition-colors"
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
