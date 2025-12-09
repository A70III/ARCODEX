import { Component, HostListener, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { ActivityBarComponent } from '../activity-bar/activity-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { EditorComponent } from '../editor/editor.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { ConfirmationModalComponent } from '../ui/confirmation-modal.component';
import { SettingsDialogComponent } from '../ui/settings-dialog.component';
import { NewProjectDialogComponent } from '../ui/new-project-dialog.component';
import { CodexLibraryComponent } from '../codex-library/codex-library.component';
import { ProjectStateService } from '../../services/project-state.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ActivityBarComponent,
    SidebarComponent,
    EditorComponent,
    StatusBarComponent,
    InfoPanelComponent,
    ConfirmationModalComponent,
    SettingsDialogComponent,
    NewProjectDialogComponent,
    CodexLibraryComponent
  ],
  template: `
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <!-- Header / Menu Bar - hidden in focus mode -->
      @if (!projectState.focusMode()) {
        <app-header />
      }
      
      <!-- Main content area -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Activity Bar (48px) - hidden in focus mode -->
        @if (!projectState.focusMode()) {
          <app-activity-bar />
        }
        
        <!-- Sidebar (Responsive width) - hidden in focus mode or codex mode -->
        @if (!projectState.focusMode() && projectState.sidebarVisible() && projectState.activeSidebarView() !== 'codex') {
          <app-sidebar class="w-[260px] lg:w-[300px] flex-shrink-0 transition-all duration-200" />
        }
        
        <!-- Codex Library - full area when active -->
        @if (projectState.activeSidebarView() === 'codex') {
          <app-codex-library class="flex-1 min-w-0 overflow-hidden" />
        } @else {
          <!-- Editor (flex-1) -->
          <app-editor class="flex-1 min-w-0 overflow-hidden" />
        }
        
        <!-- Info Panel / Right Sidebar (Responsive width) - hidden in focus mode or codex mode -->
        @if (!projectState.focusMode() && projectState.infoPanelVisible() && projectState.activeSidebarView() !== 'codex') {
          <app-info-panel class="w-[280px] lg:w-[320px] flex-shrink-0 transition-all duration-200" />
        }

        <!-- Delete Confirmation Modal -->
        @if (projectState.confirmationState()) {
          <app-confirmation-modal
            [title]="projectState.confirmationState()!.title"
            [message]="projectState.confirmationState()!.message"
            (confirm)="projectState.confirmationState()!.onConfirm()"
            (cancel)="projectState.cancelDelete()"
          />
        }
        
        <!-- Settings Dialog -->
        @if (settingsService.dialogOpen()) {
          <app-settings-dialog />
        }
        
        <!-- New Project Dialog -->
        @if (projectState.newProjectDialogOpen()) {
          <app-new-project-dialog />
        }
        
        <!-- Focus Mode Overlay - ESC to exit -->
        @if (projectState.focusMode()) {
          <div 
            class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-3 py-1.5 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity z-50"
            (click)="projectState.toggleFocusMode()"
          >
            Press <kbd class="px-1 py-0.5 bg-[var(--bg-hover)] rounded text-[var(--text-primary)]">ESC</kbd> or <kbd class="px-1 py-0.5 bg-[var(--bg-hover)] rounded text-[var(--text-primary)]">F11</kbd> to exit Focus Mode
          </div>
        }
      </div>
      
      <!-- Status Bar - hidden in focus mode -->
      @if (!projectState.focusMode()) {
        <app-status-bar />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  projectState = inject(ProjectStateService);
  settingsService = inject(SettingsService);
  
  // Use signals from service directly in template
  // sidebarVisible -> projectState.sidebarVisible
  // infoPanelVisible -> projectState.infoPanelVisible

  ngOnInit(): void {
    // Register auto-save callback
    this.settingsService.registerAutoSaveCallback(() => {
      this.projectState.saveAllFiles();
    });
  }

  ngOnDestroy(): void {
    this.settingsService.unregisterAutoSaveCallback();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    // ESC to exit focus mode
    if (event.key === 'Escape' && this.projectState.focusMode()) {
      event.preventDefault();
      this.projectState.toggleFocusMode();
      return;
    }

    // F11 to toggle focus mode
    if (event.key === 'F11') {
      event.preventDefault();
      this.projectState.toggleFocusMode();
      return;
    }

    if (isCtrlOrCmd) {
      switch (event.key.toLowerCase()) {
        case 's': // Save
          if (isShift) {
             event.preventDefault();
             this.projectState.saveAllFiles();
          } else {
            event.preventDefault();
            this.projectState.saveActiveFile();
          }
          break;
        case 'n': // New File / New Folder
          event.preventDefault();
          if (isShift) {
            this.projectState.triggerNewFolder();
          } else {
            this.projectState.triggerNewFile();
          }
          break;
        case 'o': // Open Folder
          event.preventDefault();
          this.projectState.openProject();
          break;
        case 'b': // Toggle Sidebar
          event.preventDefault();
          this.projectState.toggleSidebar();
          break;
        // Edit menu shortcuts are handled by focused element or EditorComponent
      }
    }
  }
}
