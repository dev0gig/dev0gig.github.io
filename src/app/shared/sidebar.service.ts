import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    // Breakpoint for auto-hiding sidebars (in pixels)
    // When viewport width is below this, sidebars auto-hide
    private readonly BREAKPOINT = 1200;

    // LocalStorage keys
    private readonly STORAGE_KEY_LEFT = 'sidebar_left_open';
    private readonly STORAGE_KEY_RIGHT = 'sidebar_right_open';

    // Track if screen is narrow (below breakpoint)
    isNarrowScreen = signal(false);

    // Track user's manual preference for each sidebar (persisted to localStorage)
    private userWantsLeftOpen: boolean;
    private userWantsRightOpen: boolean;

    // Left Sidebar
    isOpen = signal(true);

    // Right Sidebar
    isRightOpen = signal(true);

    constructor() {
        // Load saved preferences from localStorage
        this.userWantsLeftOpen = this.loadPreference(this.STORAGE_KEY_LEFT, true);
        this.userWantsRightOpen = this.loadPreference(this.STORAGE_KEY_RIGHT, true);

        // Initialize responsive behavior
        this.initResponsiveListener();
    }

    private loadPreference(key: string, defaultValue: boolean): boolean {
        if (typeof localStorage === 'undefined') return defaultValue;
        const saved = localStorage.getItem(key);
        if (saved === null) return defaultValue;
        return saved === 'true';
    }

    private savePreference(key: string, value: boolean): void {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(key, String(value));
    }

    private initResponsiveListener() {
        // Check initial screen size
        this.checkScreenSize(true);

        // Listen for window resize
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.checkScreenSize(false));
        }
    }

    private checkScreenSize(isInitial: boolean) {
        if (typeof window === 'undefined') return;

        const wasNarrow = this.isNarrowScreen();
        const isNarrow = window.innerWidth < this.BREAKPOINT;
        this.isNarrowScreen.set(isNarrow);

        // On initial load
        if (isInitial) {
            if (isNarrow) {
                // Start with sidebars closed on narrow screens
                this.isOpen.set(false);
                this.isRightOpen.set(false);
            } else {
                // Restore user preferences on wide screens
                this.isOpen.set(this.userWantsLeftOpen);
                this.isRightOpen.set(this.userWantsRightOpen);
            }
            return;
        }

        // Screen became narrow - auto-close sidebars
        if (isNarrow && !wasNarrow) {
            this.isOpen.set(false);
            this.isRightOpen.set(false);
        }

        // Screen became wide - restore user preferences
        if (!isNarrow && wasNarrow) {
            this.isOpen.set(this.userWantsLeftOpen);
            this.isRightOpen.set(this.userWantsRightOpen);
        }
    }

    // Left Sidebar methods
    toggle() {
        const newState = !this.isOpen();
        this.isOpen.set(newState);
        // Remember user preference when on wide screen
        if (!this.isNarrowScreen()) {
            this.userWantsLeftOpen = newState;
            this.savePreference(this.STORAGE_KEY_LEFT, newState);
        }
    }

    open() {
        this.isOpen.set(true);
        if (!this.isNarrowScreen()) {
            this.userWantsLeftOpen = true;
            this.savePreference(this.STORAGE_KEY_LEFT, true);
        }
    }

    close() {
        this.isOpen.set(false);
        if (!this.isNarrowScreen()) {
            this.userWantsLeftOpen = false;
            this.savePreference(this.STORAGE_KEY_LEFT, false);
        }
    }

    // Right Sidebar methods
    toggleRight() {
        const newState = !this.isRightOpen();
        this.isRightOpen.set(newState);
        // Remember user preference when on wide screen
        if (!this.isNarrowScreen()) {
            this.userWantsRightOpen = newState;
            this.savePreference(this.STORAGE_KEY_RIGHT, newState);
        }
    }

    openRight() {
        this.isRightOpen.set(true);
        if (!this.isNarrowScreen()) {
            this.userWantsRightOpen = true;
            this.savePreference(this.STORAGE_KEY_RIGHT, true);
        }
    }

    closeRight() {
        this.isRightOpen.set(false);
        if (!this.isNarrowScreen()) {
            this.userWantsRightOpen = false;
            this.savePreference(this.STORAGE_KEY_RIGHT, false);
        }
    }
}
