import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    // Signal to trigger settings modal opening
    private settingsTrigger = signal(0);

    // Observable for components to listen to
    get trigger() {
        return this.settingsTrigger.asReadonly();
    }

    // Method to trigger settings modal
    openSettings() {
        this.settingsTrigger.update(v => v + 1);
    }
}
