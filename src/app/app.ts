import { Component, inject, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { ThemeService } from './shared/theme.service';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { RightSidebarComponent } from './shared/right-sidebar/right-sidebar.component';
import { GlobalSettingsModal } from './shared/global-settings-modal/global-settings-modal';
import { QuickNoteComponent } from './shared/quick-note/quick-note';
import { SidebarService } from './shared/sidebar.service';
import { SettingsService } from './shared/settings.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, RightSidebarComponent, GlobalSettingsModal, QuickNoteComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Inject ThemeService to ensure it's initialized on app start
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  settingsService = inject(SettingsService);

  @ViewChild(QuickNoteComponent) quickNote!: QuickNoteComponent;

  ngOnInit() {
    // Auto-redirect Android devices to AudioNotes on initial load
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      take(1) // Only check on first navigation
    ).subscribe((event: any) => {
      // Only redirect if we're on the home page (initial load)
      if (event.url === '/' && this.isAndroidDevice()) {
        this.router.navigate(['/audio-notes']);
      }
    });
  }

  /**
   * Detect if the user is on an Android device
   */
  private isAndroidDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android');
  }

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
        case 'a':
          event.preventDefault();
          this.router.navigate(['/audio-notes']);
          break;
        case 's':
          event.preventDefault();
          this.sidebarService.toggleBoth();
          break;
        case 'n':
          event.preventDefault();
          this.quickNote?.toggle();
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

