import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { BookmarkService } from '../../shared/bookmark.service';
import { JournalService } from '../journal/journal';
import { ThemeService, ACCENT_COLORS } from '../../shared/theme.service';
import { SidebarService } from '../../shared/sidebar.service';
import { SettingsService } from '../../shared/settings.service';
import { BackupService, ProjectSelection } from '../../shared/backup.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, AppsLauncher],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
// Dashboard component with apps modal
export class Dashboard {
    bookmarkService = inject(BookmarkService);
    journalService = inject(JournalService);
    themeService = inject(ThemeService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    backupService = inject(BackupService);
    router = inject(Router);
    showSettingsModal = signal(false);

    // Accent colors for theme selection
    accentColors = ACCENT_COLORS;

    // Project selection for import/export
    projectSelection = signal<ProjectSelection>({
        bookmarks: true,
        journal: true,
        budget: true,
        recentlyPlayed: true,
        flashcards: true,
        mtgInventory: true
    });

    newBookmarkUrl = '';
    newBookmarkName = '';
    searchTerm = signal('');
    googleSearchTerm = '';

    filteredBookmarks = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const bookmarks = this.bookmarkService.bookmarks();

        if (!term) return bookmarks;

        return bookmarks.filter(b =>
            b.name.toLowerCase().includes(term) ||
            b.url.toLowerCase().includes(term)
        );
    });

    onBookmarkClick() {
        if (this.searchTerm()) {
            this.searchTerm.set('');
        }
    }

    searchGoogle(event: Event) {
        event.preventDefault();
        if (this.googleSearchTerm) {
            const query = encodeURIComponent(this.googleSearchTerm);
            window.open(`https://www.google.com/search?q=${query}`, '_blank');
            this.googleSearchTerm = '';
        }
    }

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
    }

    toggleRightSidebar() {
        this.sidebarService.toggleRight();
    }

    isEditMode = signal(false);
    editingBookmark: { id: string, name: string, url: string, customIconUrl?: string } | null = null;

    toggleEditMode() {
        this.isEditMode.update(v => !v);
        this.editingBookmark = null; // Reset editing state when toggling mode
    }

    startEditingBookmark(bookmark: any) {
        this.editingBookmark = { ...bookmark };
    }

    saveEditedBookmark() {
        if (this.editingBookmark && this.editingBookmark.name && this.editingBookmark.url) {
            this.bookmarkService.updateBookmark(this.editingBookmark.id, {
                name: this.editingBookmark.name,
                url: this.editingBookmark.url,
                customIconUrl: this.editingBookmark.customIconUrl
            });
            this.editingBookmark = null;
        }
    }

    cancelEditingBookmark() {
        this.editingBookmark = null;
    }

    addBookmark() {
        if (this.newBookmarkUrl && this.newBookmarkName) {
            this.bookmarkService.addBookmark(this.newBookmarkUrl, this.newBookmarkName);
            this.newBookmarkUrl = '';
            this.newBookmarkName = '';
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

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        input.click();
    }

    private processImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const content = e.target?.result;
            if (typeof content === 'string') {
                this.parseAndImportBookmarks(content);
            }
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
                    // Chrome exports timestamps in seconds, JS uses milliseconds
                    createdAt = parseInt(addDateStr) * 1000;
                } catch (e) {
                    console.warn('Invalid date in bookmark', e);
                }
            }

            if (url && !url.startsWith('place:')) { // Ignore smart bookmarks
                bookmarksToImport.push({ url, name, createdAt });
            }
        }

        if (bookmarksToImport.length > 0) {
            this.bookmarkService.importBookmarks(bookmarksToImport);
            this.toggleSettingsModal(); // Close modal on success
            alert(`${bookmarksToImport.length} Lesezeichen erfolgreich importiert.`);
        } else {
            alert('Keine Lesezeichen in der Datei gefunden.');
        }
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

        try {
            const exportedProjects = await this.backupService.exportSelectedData(selection);
            alert(`Export erfolgreich!\nExportierte Projekte: ${exportedProjects.join(', ')}`);
        } catch (e) {
            console.error('Export failed', e);
            alert('Export fehlgeschlagen.');
        }
    }

    triggerImportAll() {
        this.backupService.triggerImport((file) => this.processImportAllFile(file));
    }

    private async processImportAllFile(file: File) {
        try {
            const projectsToImport = await this.backupService.getAvailableProjects(file);
            const selection = this.projectSelection();

            // Filter available projects by user selection (UI only allows selecting abstract "projects", 
            // but we need to map that logic if we want to respect the checkboxes during import too)
            // The existing UI has checkboxes for Bookmarks, Journal, Budget, RecentlyPlayed.

            // We'll trust the BackupService to handle the "legacy" check logic internally or we check it here?
            // BackupService.importSelectedData handles checking if file exists in ZIP.
            // But we want to warn user BEFORE importing.

            if (projectsToImport.length === 0) {
                alert('Keine passenden Daten in der Backup-Datei gefunden.');
                return;
            }

            // We construct a friendly list for the confirm dialog
            // Note: getAvailableProjects returns raw file keys or 'legacy'.
            // For a nice message we might want to check what WILL be imported based on SELECTION + AVAILABILITY.

            // But to keep it simple and consistent with previous behavior:
            if (!confirm(`Warnung: Der Import überschreibt alle bestehenden Daten für die ausgewählten und im Backup enthaltenen Projekte.\n\nFortfahren?`)) {
                return;
            }

            const importedProjects = await this.backupService.importSelectedData(file, selection);

            if (importedProjects.length > 0) {
                this.toggleSettingsModal();
                alert(`Import erfolgreich!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);
                window.location.reload();
            } else {
                alert('Keine Daten importiert (überprüfen Sie Ihre Auswahl).');
            }

        } catch (e) {
            console.error('Import failed', e);
            alert('Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
        }
    }

    deleteAllData() {
        const selection = this.projectSelection();

        if (!this.hasAnyProjectSelected()) {
            alert('Bitte wählen Sie mindestens ein Projekt zum Löschen aus.');
            return;
        }

        // Helper to get nice names for confirmation
        const projectsToDelete = [];
        if (selection.bookmarks) projectsToDelete.push('Lesezeichen');
        if (selection.journal) projectsToDelete.push('Journal');
        if (selection.budget) projectsToDelete.push('Budget');
        if (selection.recentlyPlayed) projectsToDelete.push('Zuletzt gespielt');

        if (!confirm(`WARNUNG: Dies löscht ALLE Daten für:\n${projectsToDelete.join(', ')}\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nFortfahren?`)) {
            return;
        }

        // Double confirmation for safety
        if (!confirm('Sind Sie ABSOLUT sicher? Alle ausgewählten Daten werden unwiderruflich gelöscht!')) {
            return;
        }

        this.backupService.deleteAllData(selection);

        this.toggleSettingsModal();
        alert(`Gelöscht: ${projectsToDelete.join(', ')}\n\nDie Seite wird neu geladen.`);
        window.location.reload();
    }

    constructor() {
        // Close settings modal on route change
        this.router.events.subscribe(() => {
            if (this.showSettingsModal()) {
                this.showSettingsModal.set(false);
            }
        });
    }
}
