import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ThemeService, ACCENT_COLORS } from '../theme.service';
import { BookmarkService } from '../bookmark.service';
import { SidebarService } from '../sidebar.service';
import { BackupService, ProjectSelection } from '../backup.service';
import { FlashcardsService } from '../../features/flashcards/flashcards.service';
import { STORAGE_KEYS } from '../../core/storage-keys.const';

@Component({
    selector: 'app-global-settings-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './global-settings-modal.html'
})
export class GlobalSettingsModal {
    @Output() close = new EventEmitter<void>();

    themeService = inject(ThemeService);
    bookmarkService = inject(BookmarkService);
    sidebarService = inject(SidebarService);
    backupService = inject(BackupService);
    flashcardsService = inject(FlashcardsService);

    accentColors = ACCENT_COLORS;

    projectSelection = signal<ProjectSelection>({
        bookmarks: true,
        journal: true,
        budget: true,
        recentlyPlayed: true,
        flashcards: true,
        mtgInventory: true
    });

    onClose() {
        this.close.emit();
    }

    toggleProjectSelection(project: keyof ProjectSelection) {
        this.projectSelection.update(sel => ({
            ...sel,
            [project]: !sel[project]
        }));
    }

    selectAllProjects() {
        this.projectSelection.set({
            bookmarks: true,
            journal: true,
            budget: true,
            recentlyPlayed: true,
            flashcards: true,
            mtgInventory: true
        });
    }

    deselectAllProjects() {
        this.projectSelection.set({
            bookmarks: false,
            journal: false,
            budget: false,
            recentlyPlayed: false,
            flashcards: false,
            mtgInventory: false
        });
    }

    hasAnyProjectSelected(): boolean {
        const sel = this.projectSelection();
        return sel.bookmarks || sel.journal || sel.budget || sel.recentlyPlayed || sel.flashcards || sel.mtgInventory;
    }

    async exportAllData() {
        const selection = this.projectSelection();

        if (!this.hasAnyProjectSelected()) {
            alert('Bitte wählen Sie mindestens ein Projekt zum Exportieren aus.');
            return;
        }

        const exportedProjects = await this.backupService.exportSelectedData(selection);
        alert(`Export erfolgreich!\nExportierte Projekte: ${exportedProjects.join(', ')}`);
    }

    triggerImportAll() {
        this.backupService.triggerImport((file) => this.processImportAllFile(file));
    }

    private async processImportAllFile(file: File) {
        try {
            const selection = this.projectSelection();
            const available = await this.backupService.getAvailableProjects(file);

            const projectsToImport: string[] = [];
            if (selection.bookmarks && available.includes('bookmarks')) projectsToImport.push('Lesezeichen');
            if (selection.journal && available.includes('journal')) projectsToImport.push('Journal');
            if (selection.budget && available.includes('budget')) projectsToImport.push('Budget');
            if (selection.recentlyPlayed && available.includes('recentlyPlayed')) projectsToImport.push('Zuletzt gespielt');
            if (selection.flashcards && available.includes('flashcards')) projectsToImport.push('Flashcards');
            if (selection.mtgInventory && available.includes('mtgInventory')) projectsToImport.push('MTG Inventory');

            if (projectsToImport.length === 0 && !available.includes('legacy')) {
                alert('Keine passenden Daten in der Backup-Datei gefunden oder keine Projekte ausgewählt.');
                return;
            }

            if (!confirm(`Warnung: Der Import überschreibt alle bestehenden Daten für:\n${projectsToImport.join(', ')}\n\nFortfahren?`)) {
                return;
            }

            const importedProjects = await this.backupService.importSelectedData(file, selection);

            if (importedProjects.length === 0) {
                alert('Keine passenden Daten in der Backup-Datei gefunden oder keine Projekte ausgewählt.');
                return;
            }

            this.onClose();
            alert(`Import erfolgreich!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);
            window.location.reload();
        } catch (e) {
            console.error('Import failed', e);
            alert('Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
        }
    }

    exportBookmarks() {
        const bookmarks = this.bookmarkService.bookmarks();
        const date = Math.floor(Date.now() / 1000);

        let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${date}" LAST_MODIFIED="${date}">dev0gig Dashboard</H3>
    <DL><p>
`;

        bookmarks.forEach(b => {
            const addDate = Math.floor(b.createdAt / 1000);
            html += `        <DT><A HREF="${b.url}" ADD_DATE="${addDate}">${b.name}</A>\n`;
        });

        html += `    </DL><p>
</DL><p>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks_${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    triggerBookmarkImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processBookmarkImportFile(file);
            }
        };
        input.click();
    }

    private processBookmarkImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            this.parseAndImportBookmarks(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportBookmarks(html: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.getElementsByTagName('a');
        const bookmarksToImport: { url: string; name: string; createdAt?: number }[] = [];

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const url = link.href;
            const name = link.textContent || url;
            const addDateStr = link.getAttribute('add_date');
            let createdAt = Date.now();

            if (addDateStr) {
                try {
                    createdAt = parseInt(addDateStr) * 1000;
                } catch (e) {
                    console.warn('Invalid date in bookmark', e);
                }
            }

            if (url && !url.startsWith('place:')) {
                bookmarksToImport.push({ url, name, createdAt });
            }
        }

        if (bookmarksToImport.length > 0) {
            this.bookmarkService.importBookmarks(bookmarksToImport);
            this.onClose();
            alert(`${bookmarksToImport.length} Lesezeichen erfolgreich importiert.`);
        } else {
            alert('Keine Lesezeichen in der Datei gefunden.');
        }
    }

    deleteAllData() {
        const selection = this.projectSelection();

        if (!this.hasAnyProjectSelected()) {
            alert('Bitte wählen Sie mindestens ein Projekt zum Löschen aus.');
            return;
        }

        const projectsToDelete = [];
        if (selection.bookmarks) projectsToDelete.push('Lesezeichen');
        if (selection.journal) projectsToDelete.push('Journal');
        if (selection.budget) projectsToDelete.push('Budget');
        if (selection.recentlyPlayed) projectsToDelete.push('Zuletzt gespielt');
        if (selection.flashcards) projectsToDelete.push('Flashcards');
        if (selection.mtgInventory) projectsToDelete.push('MTG Inventory');

        if (!confirm(`WARNUNG: Dies löscht ALLE Daten für:\n${projectsToDelete.join(', ')}\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nFortfahren?`)) {
            return;
        }

        if (!confirm('Sind Sie ABSOLUT sicher? Alle ausgewählten Daten werden unwiderruflich gelöscht!')) {
            return;
        }

        if (selection.bookmarks) {
            localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
        }

        if (selection.journal) {
            localStorage.removeItem(STORAGE_KEYS.JOURNAL);
        }

        if (selection.budget) {
            localStorage.removeItem(STORAGE_KEYS.BUDGET.TRANSACTIONS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.ACCOUNTS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.CATEGORIES);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.FIXED_COSTS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.FIXED_COST_GROUPS);
        }

        if (selection.recentlyPlayed) {
            localStorage.removeItem(STORAGE_KEYS.YOUTUBE);
        }

        if (selection.flashcards) {
            this.flashcardsService.importData({ cards: [], decks: [] });
        }

        if (selection.mtgInventory) {
            localStorage.removeItem(STORAGE_KEYS.MTG.CARDS);
            localStorage.removeItem(STORAGE_KEYS.MTG.CACHE);
        }

        this.onClose();
        alert(`Gelöscht: ${projectsToDelete.join(', ')}\n\nDie Seite wird neu geladen.`);
        window.location.reload();
    }
}
