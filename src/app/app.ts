import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/theme.service';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { RightSidebarComponent } from './shared/right-sidebar/right-sidebar.component';
import { GlobalSettingsModal } from './shared/global-settings-modal/global-settings-modal';
import { GlobalToastComponent } from './shared/components/toast/global-toast.component';
import { SidebarService } from './shared/sidebar.service';
import { SettingsService } from './shared/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, RightSidebarComponent, GlobalSettingsModal, GlobalToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Inject ThemeService to ensure it's initialized on app start
  private themeService = inject(ThemeService);
  private sidebarService = inject(SidebarService);
  settingsService = inject(SettingsService);

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Export/Import shortcuts with Ctrl key
    if (event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case 'e':
          // Ctrl+E is handled by sidebar component for export
          // We dispatch a custom event that the sidebar can listen to
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('app:export'));
          break;
        case 'i':
          // Ctrl+I is handled by sidebar component for import
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('app:import'));
          break;
      }
    }
  }
}
