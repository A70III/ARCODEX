import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { ActivityBarComponent } from '../activity-bar/activity-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { EditorComponent } from '../editor/editor.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { ConfirmationModalComponent } from '../ui/confirmation-modal.component';
import { ProjectStateService } from '../../services/project-state.service';

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
    ConfirmationModalComponent
  ],
  template: `
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <!-- Header / Menu Bar -->
      <app-header />
      
      <!-- Main content area -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Activity Bar (48px) -->
        <app-activity-bar />
        
        <!-- Sidebar (250px) -->
        @if (projectState.sidebarVisible()) {
          <app-sidebar class="w-[250px] flex-shrink-0" />
        }
        
        <!-- Editor (flex-1) -->
        <app-editor class="flex-1 min-w-0 overflow-hidden" />
        
        <!-- Info Panel / Right Sidebar (280px) -->
        @if (projectState.infoPanelVisible()) {
          <app-info-panel class="w-[280px] flex-shrink-0" />
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
      </div>
      
      <!-- Status Bar -->
      <app-status-bar />
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
export class MainLayoutComponent {
  projectState = inject(ProjectStateService);
  
  // Use signals from service directly in template
  // sidebarVisible -> projectState.sidebarVisible
  // infoPanelVisible -> projectState.infoPanelVisible

  constructor() {
    // No need for event listeners anymore as state is shared
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

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
