import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PwaService {
    deferredPrompt: any;
    canInstall = signal(false);

    constructor() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.canInstall.set(true);
        });
    }

    async installPwa() {
        if (!this.deferredPrompt) {
            return;
        }
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        this.canInstall.set(false);
    }
}
