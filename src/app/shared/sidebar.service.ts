import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../core/storage-keys.const';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    // Setting: Are sidebars permanently visible? (default: false = show overlay mode)
    permanentSidebars = signal(false);

    // Left Sidebar state
    isOpen = signal(false);

    // Right Sidebar state
    isRightOpen = signal(false);

    constructor() {
        // Load permanent visibility setting from localStorage
        this.permanentSidebars.set(this.loadPreference(STORAGE_KEYS.SIDEBAR, false));

        // If permanent mode is enabled, open both sidebars on init
        if (this.permanentSidebars()) {
            this.isOpen.set(true);
            this.isRightOpen.set(true);
        }
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

    // Toggle permanent sidebar visibility setting
    setPermanentSidebars(value: boolean) {
        this.permanentSidebars.set(value);
        this.savePreference(STORAGE_KEYS.SIDEBAR, value);

        if (value) {
            // When enabling permanent mode, open both sidebars
            this.isOpen.set(true);
            this.isRightOpen.set(true);
        } else {
            // When disabling permanent mode, close both sidebars
            this.isOpen.set(false);
            this.isRightOpen.set(false);
        }
    }

    // Check if overlay should be shown (sidebars not permanent and any sidebar is open)
    shouldShowOverlay(): boolean {
        return !this.permanentSidebars() && (this.isOpen() || this.isRightOpen());
    }

    // Left Sidebar methods
    toggle() {
        this.isOpen.set(!this.isOpen());
    }

    open() {
        this.isOpen.set(true);
    }

    close() {
        this.isOpen.set(false);
    }

    // Right Sidebar methods
    toggleRight() {
        this.isRightOpen.set(!this.isRightOpen());
    }

    openRight() {
        this.isRightOpen.set(true);
    }

    closeRight() {
        this.isRightOpen.set(false);
    }

    // Toggle both sidebars
    toggleBoth() {
        if (this.isOpen() || this.isRightOpen()) {
            this.close();
            this.closeRight();
        } else {
            this.open();
            this.openRight();
        }
    }

    // Close all sidebars (for overlay click or button click in non-permanent mode)
    closeAll() {
        this.isOpen.set(false);
        this.isRightOpen.set(false);
    }

    // Close sidebar after action (for button clicks inside sidebar when not permanent)
    closeAfterAction() {
        if (!this.permanentSidebars()) {
            this.closeAll();
        }
    }
}
