import { Component, inject, HostListener, OnInit, OnDestroy, NgZone } from '@angular/core';
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
export class App implements OnInit, OnDestroy {
  // Inject ThemeService to ensure it's initialized on app start
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private ngZone = inject(NgZone);

  // Swipe gesture tracking
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private readonly SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
  private readonly SWIPE_EDGE_ZONE = 50; // Edge zone width for triggering sidebar open
  private readonly SWIPE_VERTICAL_THRESHOLD = 100; // Max vertical movement to still count as horizontal swipe

  // Bound event handlers for cleanup
  private boundTouchStart = this.handleTouchStart.bind(this);
  private boundTouchEnd = this.handleTouchEnd.bind(this);

  ngOnInit() {
    // Add touch event listeners for swipe gestures
    if (typeof document !== 'undefined') {
      document.addEventListener('touchstart', this.boundTouchStart, { passive: true });
      document.addEventListener('touchend', this.boundTouchEnd, { passive: true });
    }
  }

  ngOnDestroy() {
    // Clean up touch event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('touchstart', this.boundTouchStart);
      document.removeEventListener('touchend', this.boundTouchEnd);
    }
  }

  private handleTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }

  private handleTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
    this.handleSwipeGesture();
  }

  private handleSwipeGesture() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = Math.abs(this.touchEndY - this.touchStartY);

    // Ignore if vertical movement is too large (not a horizontal swipe)
    if (deltaY > this.SWIPE_VERTICAL_THRESHOLD) {
      return;
    }

    // Check if swipe distance meets threshold
    if (Math.abs(deltaX) < this.SWIPE_THRESHOLD) {
      return;
    }

    const screenWidth = window.innerWidth;
    const isSwipeRight = deltaX > 0;
    const isSwipeLeft = deltaX < 0;
    const startedFromLeftEdge = this.touchStartX < this.SWIPE_EDGE_ZONE;
    const startedFromRightEdge = this.touchStartX > screenWidth - this.SWIPE_EDGE_ZONE;

    // Run sidebar changes inside Angular zone to ensure change detection
    this.ngZone.run(() => {
      // Swipe right from left edge -> open left sidebar
      if (isSwipeRight && startedFromLeftEdge && !this.sidebarService.isOpen()) {
        this.sidebarService.open();
        return;
      }

      // Swipe left when left sidebar is open -> close left sidebar
      if (isSwipeLeft && this.sidebarService.isOpen()) {
        this.sidebarService.close();
        return;
      }

      // Swipe left from right edge -> open right sidebar
      if (isSwipeLeft && startedFromRightEdge && !this.sidebarService.isRightOpen()) {
        this.sidebarService.openRight();
        return;
      }

      // Swipe right when right sidebar is open -> close right sidebar
      if (isSwipeRight && this.sidebarService.isRightOpen()) {
        this.sidebarService.closeRight();
        return;
      }
    });
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
