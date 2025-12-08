import { Component, inject, signal, HostListener } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { ActivityBarComponent } from '../activity-bar/activity-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { EditorComponent } from '../editor/editor.component';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HeaderComponent, ActivityBarComponent, SidebarComponent, EditorComponent, InfoPanelComponent, StatusBarComponent],
  template: `
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <!-- Header / Menu Bar -->
      <app-header />
      
      <!-- Main content area -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Activity Bar (48px) -->
        <app-activity-bar />
        
        <!-- Sidebar (250px) -->
        @if (sidebarVisible()) {
          <app-sidebar class="w-[250px] flex-shrink-0" />
        }
        
        <!-- Editor (flex-1) -->
        <app-editor class="flex-1 min-w-0 overflow-hidden" />
        
        <!-- Info Panel / Right Sidebar (280px) -->
        @if (infoPanelVisible()) {
          <app-info-panel class="w-[280px] flex-shrink-0" />
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
  sidebarVisible = signal(true);
  infoPanelVisible = signal(true);

  constructor() {
    // Listen for toggle events from header
    document.addEventListener('toggleSidebar', ((e: CustomEvent) => {
      this.sidebarVisible.set(e.detail);
    }) as EventListener);

    document.addEventListener('toggleInfoPanel', ((e: CustomEvent) => {
      this.infoPanelVisible.set(e.detail);
    }) as EventListener);
  }
}
