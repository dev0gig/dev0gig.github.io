import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PwaService } from '../pwa.service';
import { SidebarService } from '../sidebar.service';
import { SettingsService } from '../settings.service';
import { BackupService } from '../backup.service';
import { BookmarkService } from '../bookmark.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
    pwa = inject(PwaService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    backupService = inject(BackupService);
    bookmarkService = inject(BookmarkService);

    private exportHandler = () => this.exportAllData();
    private importHandler = () => this.triggerImportAll();

    ngOnInit() {
        window.addEventListener('app:export', this.exportHandler);
        window.addEventListener('app:import', this.importHandler);
    }

    ngOnDestroy() {
        window.removeEventListener('app:export', this.exportHandler);
        window.removeEventListener('app:import', this.importHandler);
    }

    toggleSidebar() {
        this.sidebarService.toggle();
    }

    // Handle overlay click - stop propagation to prevent clicks going through
    onOverlayClick(event: Event) {
        event.stopPropagation();
        event.preventDefault();
        this.sidebarService.closeAll();
    }

    onSettingsClick() {
        this.settingsService.openSettings();
    }

    installPwa() {
        this.pwa.installPwa();
        this.sidebarService.closeAfterAction();
    }

    async exportAllData() {
        await this.backupService.exportAllData();
    }

    triggerImportAll() {
        this.backupService.triggerImport((file) => this.processImportAllFile(file));
    }

    private async processImportAllFile(file: File) {
        try {
            const available = await this.backupService.getAvailableProjects(file);

            if (available.length === 0) {
                alert('Keine passenden Daten in der Backup-Datei gefunden.');
                return;
            }

            if (!confirm('Warnung: Der Import überschreibt alle bestehenden Daten.\n\nFortfahren?')) {
                return;
            }

            const importedProjects = await this.backupService.importAllData(file);

            alert(`Import erfolgreich!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);

            // Reload to apply changes
            window.location.reload();
        } catch (e) {
            console.error('Import failed', e);
            alert('Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
        }
    }
}
