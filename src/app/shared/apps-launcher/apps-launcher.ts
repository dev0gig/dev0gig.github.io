import { Component, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PwaService } from '../pwa.service';
import { BookmarkService } from '../bookmark.service';

@Component({
    selector: 'app-apps-launcher',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './apps-launcher.html',
    styleUrl: './apps-launcher.css'
})
export class AppsLauncher {
    pwa = inject(PwaService);
    bookmarkService = inject(BookmarkService);
    showAppsModal = signal(false);
    openSettings = output<void>();

    toggleAppsModal() {
        this.showAppsModal.update(v => !v);
    }

    onSettingsClick() {
        this.showAppsModal.set(false);
        this.openSettings.emit();
    }

    installPwa() {
        this.pwa.installPwa();
        this.showAppsModal.set(false);
    }
}
