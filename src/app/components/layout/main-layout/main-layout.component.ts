import { Component, HostListener, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { ActivityBarComponent } from '../activity-bar/activity-bar.component';
import { SidebarComponent } from '../../sidebar/sidebar/sidebar.component';
import { EditorComponent } from '../../editor/editor.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { InfoPanelComponent } from '../../info-panel/info-panel/info-panel.component';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal.component';
import { SettingsDialogComponent } from '../../shared/settings-dialog.component';
import { NewProjectDialogComponent } from '../../shared/new-project-dialog.component';
import { CodexLibraryComponent } from '../../workspace/codex-library/codex-library.component';
import { ProjectStateService } from '../../../services/project-state.service';
import { SettingsService } from '../../../services/settings.service';

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
    <div 
      class="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)]"
      (mouseup)="stopResize()"
      (mouseleave)="stopResize()"
      (mousemove)="onResize($event)"
    >
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
        
        <!-- Sidebar (Resizable) - hidden in focus mode or codex mode -->
        @if (!projectState.focusMode() && projectState.sidebarVisible() && projectState.activeSidebarView() !== 'codex') {
          <div 
            class="relative flex-shrink-0 flex h-full"
            [style.width.px]="sidebarWidth()"
          >
            <app-sidebar class="w-full h-full overflow-hidden" />
            
            <!-- Resizer Handle -->
            <div 
              class="resizer-handle right" 
              (mousedown)="startResizeSidebar($event)"
            ></div>
          </div>
        }
        
        <!-- Codex Library - full area when active -->
        @if (projectState.activeSidebarView() === 'codex') {
          <app-codex-library class="flex-1 min-w-0 overflow-hidden" />
        } @else {
          <!-- Editor (flex-1) -->
          <div class="flex-1 min-w-0 overflow-hidden relative h-full">
            <app-editor class="w-full h-full" />
          </div>
        }
        
        <!-- Info Panel / Right Sidebar (Resizable) - hidden in focus mode or codex mode -->
        @if (!projectState.focusMode() && projectState.infoPanelVisible() && projectState.activeSidebarView() !== 'codex') {
          <div 
            class="relative flex-shrink-0 flex h-full"
            [style.width.px]="infoPanelWidth()"
          >
             <!-- Resizer Handle (Left side of panel) -->
             <div 
              class="resizer-handle left" 
              (mousedown)="startResizeInfoPanel($event)"
            ></div>
            
            <app-info-panel class="w-full h-full overflow-hidden" />
          </div>
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
        
        <!-- Resize Overlay (invisible) to prevent iframe/selection interference during drag -->
        @if (isResizing()) {
          <div class="fixed inset-0 z-[9999] cursor-col-resize"></div>
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
    
    .resizer-handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: col-resize;
      z-index: 10;
      transition: background-color 0.2s;
    }
    
    .resizer-handle:hover, .resizer-handle:active {
      background-color: var(--accent);
    }
    
    .resizer-handle.right {
      right: -2px; /* Center over border */
    }
    
    .resizer-handle.left {
      left: -2px; /* Center over border */
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  projectState = inject(ProjectStateService);
  settingsService = inject(SettingsService);
  
  // Resizable state
  sidebarWidth = signal(260);
  infoPanelWidth = signal(280);
  
  isResizingSidebar = signal(false);
  isResizingInfoPanel = signal(false);
  
  // Computed helper to check if any resize is active
  isResizing = signal(false);

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
  
  // Resize Handlers
  
  startResizeSidebar(event: MouseEvent): void {
    event.preventDefault();
    this.isResizingSidebar.set(true);
    this.isResizing.set(true);
  }
  
  startResizeInfoPanel(event: MouseEvent): void {
    event.preventDefault();
    this.isResizingInfoPanel.set(true);
    this.isResizing.set(true);
  }
  
  onResize(event: MouseEvent): void {
    if (this.isResizingSidebar()) {
      // Calculate new sidebar width based on mouse X (approx)
      // We assume sidebar is on the left, starting after activity bar (48px)
      // So width = mouseX - 48
      const newWidth = Math.max(150, Math.min(600, event.clientX - 49)); // 49 is approx activity bar width + 1 for border
      this.sidebarWidth.set(newWidth);
    } 
    else if (this.isResizingInfoPanel()) {
      // Info panel is on the right
      // Width = WindowWidth - MouseX
      const windowWidth = window.innerWidth;
      const newWidth = Math.max(200, Math.min(600, windowWidth - event.clientX));
      this.infoPanelWidth.set(newWidth);
    }
  }
  
  stopResize(): void {
    if (this.isResizing()) {
      this.isResizingSidebar.set(false);
      this.isResizingInfoPanel.set(false);
      this.isResizing.set(false);
    }
  }
}
