import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    // Left Sidebar
    isOpen = signal(true);

    toggle() {
        this.isOpen.update(v => !v);
    }

    open() {
        this.isOpen.set(true);
    }

    close() {
        this.isOpen.set(false);
    }

    // Right Sidebar
    isRightOpen = signal(true);

    toggleRight() {
        this.isRightOpen.update(v => !v);
    }

    openRight() {
        this.isRightOpen.set(true);
    }

    closeRight() {
        this.isRightOpen.set(false);
    }
}
