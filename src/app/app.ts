import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/theme.service';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { RightSidebarComponent } from './shared/right-sidebar/right-sidebar.component';
import { SidebarService } from './shared/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, RightSidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Inject ThemeService to ensure it's initialized on app start
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Navigation shortcuts with Alt key
    if (event.altKey && !event.ctrlKey && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case 'd':
          event.preventDefault();
          this.router.navigate(['/']);
          break;
        case 'j':
          event.preventDefault();
          this.router.navigate(['/journal']);
          break;
        case 'b':
          event.preventDefault();
          this.router.navigate(['/budget']);
          break;
        case 'm':
          event.preventDefault();
          this.router.navigate(['/manga-builder']);
          break;
        case 's':
          event.preventDefault();
          this.sidebarService.toggleBoth();
          break;
      }
    }

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
