import { Component } from '@angular/core';

@Component({
  selector: 'app-shortcuts',
  standalone: true,
  template: `
    <div class="mt-6 pt-4 border-t border-[var(--border-color)]">
      <div class="text-[var(--text-secondary)] text-xs mb-2 uppercase font-medium">Shortcuts</div>
      <div class="space-y-1.5 text-sm">
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>Save</span>
          <kbd class="shortcut-key">Ctrl+S</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>New File</span>
          <kbd class="shortcut-key">Ctrl+N</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>New Folder</span>
          <kbd class="shortcut-key">Ctrl+Shift+N</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>Open Folder</span>
          <kbd class="shortcut-key">Ctrl+O</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>Toggle Sidebar</span>
          <kbd class="shortcut-key">Ctrl+B</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>Bold</span>
          <kbd class="shortcut-key">Ctrl+B</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>Italic</span>
          <kbd class="shortcut-key">Ctrl+I</kbd>
        </div>
        <div class="flex items-center justify-between text-[var(--text-primary)]">
          <span>Underline</span>
          <kbd class="shortcut-key">Ctrl+U</kbd>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shortcut-key {
      padding: 0.125rem 0.375rem;
      background-color: var(--bg-hover);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-primary);
      min-width: 20px;
      text-align: center;
    }
  `]
})
export class ShortcutsComponent {}
