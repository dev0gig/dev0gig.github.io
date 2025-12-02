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

    downloadMangaBuilder() {
        if (confirm('Möchten Sie das Manga Builder Tool herunterladen?')) {
            const link = document.createElement('a');
            link.href = 'manga_builder_gui.exe';
            link.download = 'manga_builder_gui.exe';
            link.click();
        }
        this.showAppsModal.set(false);
    }

    downloadAudioNotes() {
        if (confirm('Möchten Sie die AudioNotes App herunterladen?')) {
            const link = document.createElement('a');
            link.href = 'audionotes.apk';
            link.download = 'audionotes.apk';
            link.click();
        }
        this.showAppsModal.set(false);
    }
}
