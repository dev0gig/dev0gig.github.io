import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { BookmarkService } from '../../shared/bookmark.service';
import { JournalService } from '../journal/journal';

interface ProjectSelection {
    bookmarks: boolean;
    journal: boolean;
    budget: boolean;
}

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
    router = inject(Router);
    isOnline = signal(true);
    showSettingsModal = signal(false);

    // Project selection for import/export
    projectSelection = signal<ProjectSelection>({
        bookmarks: true,
        journal: true,
        budget: true
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

    isEditMode = signal(false);
    editingBookmark: { id: string, name: string, url: string } | null = null;

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
                url: this.editingBookmark.url
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

    navigateToJournal() {
        this.router.navigate(['/journal']);
    }

    navigateToBudget() {
        this.router.navigate(['/budget']);
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
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        input.click();
    }

    private processImportFile(file: File) {
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
            budget: true
        });
    }

    deselectAllProjects() {
        this.projectSelection.set({
            bookmarks: false,
            journal: false,
            budget: false
        });
    }

    hasAnyProjectSelected(): boolean {
        const sel = this.projectSelection();
        return sel.bookmarks || sel.journal || sel.budget;
    }

    async exportAllData() {
        const selection = this.projectSelection();

        if (!this.hasAnyProjectSelected()) {
            alert('Bitte wählen Sie mindestens ein Projekt zum Exportieren aus.');
            return;
        }

        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const exportDate = new Date().toISOString();

        // Export Bookmarks as separate JSON file
        if (selection.bookmarks) {
            const bookmarks = this.bookmarkService.bookmarks();
            const bookmarksData = {
                exportDate,
                version: '1.0',
                project: 'bookmarks',
                data: bookmarks
            };
            zip.file('bookmarks.json', JSON.stringify(bookmarksData, null, 2));
        }

        // Export Journal as separate JSON file
        if (selection.journal) {
            const journalEntries = this.journalService.entries();
            const journalData = {
                exportDate,
                version: '1.0',
                project: 'journal',
                data: journalEntries
            };
            zip.file('journal.json', JSON.stringify(journalData, null, 2));
        }

        // Export Budget as separate JSON file
        if (selection.budget) {
            const transactions = localStorage.getItem('mybudget_transactions');
            const accounts = localStorage.getItem('mybudget_accounts');
            const categories = localStorage.getItem('mybudget_categories');
            const fixedCosts = localStorage.getItem('mybudget_fixedcosts');

            const budgetData = {
                exportDate,
                version: '1.1',
                project: 'budget',
                data: {
                    transactions: transactions ? JSON.parse(transactions) : [],
                    accounts: accounts ? JSON.parse(accounts) : [],
                    categories: categories ? JSON.parse(categories) : [],
                    fixedCosts: fixedCosts ? JSON.parse(fixedCosts) : []
                }
            };
            zip.file('budget.json', JSON.stringify(budgetData, null, 2));
        }

        // Generate and download
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_backup_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);

        const selectedProjects = [];
        if (selection.bookmarks) selectedProjects.push('Lesezeichen');
        if (selection.journal) selectedProjects.push('Journal');
        if (selection.budget) selectedProjects.push('Budget');

        alert(`Export erfolgreich!\nExportierte Projekte: ${selectedProjects.join(', ')}`);
    }

    triggerImportAll() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportAllFile(file);
            }
        };
        input.click();
    }

    private async processImportAllFile(file: File) {
        try {
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(file);

            const selection = this.projectSelection();
            const importedProjects: string[] = [];
            const projectsToImport: string[] = [];

            // Check which files exist in the ZIP
            const bookmarksFile = zip.file('bookmarks.json');
            const journalFile = zip.file('journal.json');
            const budgetFile = zip.file('budget.json');

            // Also check for legacy format (dashboard_backup.json)
            const legacyFile = zip.file('dashboard_backup.json');

            // Determine which projects can be imported
            if (selection.bookmarks && bookmarksFile) projectsToImport.push('Lesezeichen');
            if (selection.journal && journalFile) projectsToImport.push('Journal');
            if (selection.budget && budgetFile) projectsToImport.push('Budget');

            // If no new format files found, try legacy format
            if (projectsToImport.length === 0 && legacyFile) {
                await this.processLegacyImport(legacyFile, selection);
                return;
            }

            if (projectsToImport.length === 0) {
                alert('Keine passenden Daten in der Backup-Datei gefunden oder keine Projekte ausgewählt.');
                return;
            }

            if (!confirm(`Warnung: Der Import überschreibt alle bestehenden Daten für:\n${projectsToImport.join(', ')}\n\nFortfahren?`)) {
                return;
            }

            // Import Bookmarks
            if (selection.bookmarks && bookmarksFile) {
                const content = await bookmarksFile.async('string');
                const bookmarksData = JSON.parse(content);
                const bookmarks = (bookmarksData.data || []).map((b: any) => ({
                    ...b,
                    createdAt: b.createdAt || Date.now()
                }));
                this.bookmarkService.importBookmarks(bookmarks, true);
                importedProjects.push('Lesezeichen');
            }

            // Import Journal
            if (selection.journal && journalFile) {
                const content = await journalFile.async('string');
                const journalData = JSON.parse(content);
                const entries = (journalData.data || []).map((e: any) => ({
                    ...e,
                    date: new Date(e.date)
                }));
                localStorage.setItem('terminal_journal_entries', JSON.stringify(entries));
                importedProjects.push('Journal');
            }

            // Import Budget
            if (selection.budget && budgetFile) {
                const content = await budgetFile.async('string');
                const budgetData = JSON.parse(content);
                const budget = budgetData.data || {};
                if (budget.transactions) {
                    localStorage.setItem('mybudget_transactions', JSON.stringify(budget.transactions));
                }
                if (budget.accounts) {
                    localStorage.setItem('mybudget_accounts', JSON.stringify(budget.accounts));
                }
                if (budget.categories) {
                    localStorage.setItem('mybudget_categories', JSON.stringify(budget.categories));
                }
                if (budget.fixedCosts) {
                    localStorage.setItem('mybudget_fixedcosts', JSON.stringify(budget.fixedCosts));
                }
                importedProjects.push('Budget');
            }

            this.toggleSettingsModal();
            alert(`Import erfolgreich!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);

            // Reload to apply changes
            window.location.reload();
        } catch (e) {
            console.error('Import failed', e);
            alert('Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
        }
    }

    private async processLegacyImport(legacyFile: any, selection: ProjectSelection) {
        const content = await legacyFile.async('string');
        const data = JSON.parse(content);

        if (!data.projects) {
            alert('Ungültige Backup-Datei: Keine Projektdaten gefunden.');
            return;
        }

        const importedProjects: string[] = [];
        const projectsToImport: string[] = [];

        if (selection.bookmarks && data.projects.bookmarks) projectsToImport.push('Lesezeichen');
        if (selection.journal && data.projects.journal) projectsToImport.push('Journal');
        if (selection.budget && data.projects.budget) projectsToImport.push('Budget');

        if (projectsToImport.length === 0) {
            alert('Keine passenden Daten in der Backup-Datei gefunden oder keine Projekte ausgewählt.');
            return;
        }

        if (!confirm(`Warnung: Der Import überschreibt alle bestehenden Daten für:\n${projectsToImport.join(', ')}\n\nFortfahren?`)) {
            return;
        }

        // Import Bookmarks
        if (selection.bookmarks && data.projects.bookmarks) {
            const bookmarks = data.projects.bookmarks.map((b: any) => ({
                ...b,
                createdAt: b.createdAt || Date.now()
            }));
            this.bookmarkService.importBookmarks(bookmarks, true);
            importedProjects.push('Lesezeichen');
        }

        // Import Journal
        if (selection.journal && data.projects.journal) {
            const entries = data.projects.journal.map((e: any) => ({
                ...e,
                date: new Date(e.date)
            }));
            localStorage.setItem('terminal_journal_entries', JSON.stringify(entries));
            importedProjects.push('Journal');
        }

        // Import Budget
        if (selection.budget && data.projects.budget) {
            const budget = data.projects.budget;
            if (budget.transactions) {
                localStorage.setItem('mybudget_transactions', JSON.stringify(budget.transactions));
            }
            if (budget.accounts) {
                localStorage.setItem('mybudget_accounts', JSON.stringify(budget.accounts));
            }
            if (budget.categories) {
                localStorage.setItem('mybudget_categories', JSON.stringify(budget.categories));
            }
            if (budget.fixedCosts) {
                localStorage.setItem('mybudget_fixedcosts', JSON.stringify(budget.fixedCosts));
            }
            importedProjects.push('Budget');
        }

        this.toggleSettingsModal();
        alert(`Import erfolgreich (Legacy-Format)!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);

        window.location.reload();
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

        if (!confirm(`WARNUNG: Dies löscht ALLE Daten für:\n${projectsToDelete.join(', ')}\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nFortfahren?`)) {
            return;
        }

        // Double confirmation for safety
        if (!confirm('Sind Sie ABSOLUT sicher? Alle ausgewählten Daten werden unwiderruflich gelöscht!')) {
            return;
        }

        // Delete Bookmarks
        if (selection.bookmarks) {
            localStorage.removeItem('dashboard_bookmarks');
        }

        // Delete Journal
        if (selection.journal) {
            localStorage.removeItem('terminal_journal_entries');
        }

        // Delete Budget
        if (selection.budget) {
            localStorage.removeItem('mybudget_transactions');
            localStorage.removeItem('mybudget_accounts');
            localStorage.removeItem('mybudget_categories');
            localStorage.removeItem('mybudget_fixedcosts');
        }

        this.toggleSettingsModal();
        alert(`Gelöscht: ${projectsToDelete.join(', ')}\n\nDie Seite wird neu geladen.`);
        window.location.reload();
    }

    constructor() {
        window.addEventListener('blur', () => this.isOnline.set(false));
        window.addEventListener('focus', () => this.isOnline.set(true));
    }
}
