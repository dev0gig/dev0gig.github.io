import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    // Signal to control global settings modal visibility
    showGlobalSettings = signal(false);

    // Method to open global settings modal
    openSettings() {
        this.showGlobalSettings.set(true);
    }

    // Method to close global settings modal
    closeSettings() {
        this.showGlobalSettings.set(false);
    }

    // Toggle global settings modal
    toggleSettings() {
        this.showGlobalSettings.update(v => !v);
    }
}
