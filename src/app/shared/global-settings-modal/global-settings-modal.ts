import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { ThemeService, ACCENT_COLORS } from '../theme.service';
import { BookmarkService } from '../bookmark.service';
import { JournalService } from '../../features/journal/journal';
import { FlashcardsService } from '../../features/flashcards/flashcards.service';

export interface ProjectSelection {
    bookmarks: boolean;
    journal: boolean;
    budget: boolean;
    audioNotes: boolean;
    recentlyPlayed: boolean;
    flashcards: boolean;
}

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
    journalService = inject(JournalService);
    flashcardsService = inject(FlashcardsService);

    accentColors = ACCENT_COLORS;

    projectSelection = signal<ProjectSelection>({
        bookmarks: true,
        journal: true,
        budget: true,
        audioNotes: true,
        recentlyPlayed: true,
        flashcards: true
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
            audioNotes: true,
            recentlyPlayed: true,
            flashcards: true
        });
    }

    deselectAllProjects() {
        this.projectSelection.set({
            bookmarks: false,
            journal: false,
            budget: false,
            audioNotes: false,
            recentlyPlayed: false,
            flashcards: false
        });
    }

    hasAnyProjectSelected(): boolean {
        const sel = this.projectSelection();
        return sel.bookmarks || sel.journal || sel.budget || sel.audioNotes || sel.recentlyPlayed || sel.flashcards;
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

        if (selection.budget) {
            const transactions = localStorage.getItem('mybudget_transactions');
            const accounts = localStorage.getItem('mybudget_accounts');
            const categories = localStorage.getItem('mybudget_categories');
            const fixedCosts = localStorage.getItem('mybudget_fixedcosts');
            const fixedCostGroups = localStorage.getItem('mybudget_fixedcostgroups');

            const budgetData = {
                exportDate,
                version: '1.2',
                project: 'budget',
                data: {
                    transactions: transactions ? JSON.parse(transactions) : [],
                    accounts: accounts ? JSON.parse(accounts) : [],
                    categories: categories ? JSON.parse(categories) : [],
                    fixedCosts: fixedCosts ? JSON.parse(fixedCosts) : [],
                    fixedCostGroups: fixedCostGroups ? JSON.parse(fixedCostGroups) : []
                }
            };
            zip.file('budget.json', JSON.stringify(budgetData, null, 2));
        }

        if (selection.audioNotes) {
            const audioNotes = localStorage.getItem('audio_notes_entries');
            const audioNotesData = {
                exportDate,
                version: '1.0',
                project: 'audioNotes',
                data: audioNotes ? JSON.parse(audioNotes) : []
            };
            zip.file('audionotes.json', JSON.stringify(audioNotesData, null, 2));
        }

        if (selection.recentlyPlayed) {
            const urlHistory = localStorage.getItem('youtube_url_history');
            const recentlyPlayedData = {
                exportDate,
                version: '1.0',
                project: 'recentlyPlayed',
                data: urlHistory ? JSON.parse(urlHistory) : []
            };
            zip.file('recentlyplayed.json', JSON.stringify(recentlyPlayedData, null, 2));
        }

        if (selection.flashcards) {
            const flashcardsData = localStorage.getItem('flashcards_data');
            const flashcardsDecks = localStorage.getItem('flashcards_decks');
            const exportData = {
                exportDate,
                version: '1.0',
                project: 'flashcards',
                data: {
                    cards: flashcardsData ? JSON.parse(flashcardsData) : [],
                    decks: flashcardsDecks ? JSON.parse(flashcardsDecks) : []
                }
            };
            zip.file('flashcards.json', JSON.stringify(exportData, null, 2));
        }

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
        if (selection.audioNotes) selectedProjects.push('AudioNotes');
        if (selection.recentlyPlayed) selectedProjects.push('Zuletzt gespielt');
        if (selection.flashcards) selectedProjects.push('Flashcards');

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

            const bookmarksFile = zip.file('bookmarks.json');
            const journalFile = zip.file('journal.json');
            const budgetFile = zip.file('budget.json');
            const audioNotesFile = zip.file('audionotes.json');
            const recentlyPlayedFile = zip.file('recentlyplayed.json');
            const flashcardsFile = zip.file('flashcards.json');
            const legacyFile = zip.file('dashboard_backup.json');

            if (selection.bookmarks && bookmarksFile) projectsToImport.push('Lesezeichen');
            if (selection.journal && journalFile) projectsToImport.push('Journal');
            if (selection.budget && budgetFile) projectsToImport.push('Budget');
            if (selection.audioNotes && audioNotesFile) projectsToImport.push('AudioNotes');
            if (selection.recentlyPlayed && recentlyPlayedFile) projectsToImport.push('Zuletzt gespielt');
            if (selection.flashcards && flashcardsFile) projectsToImport.push('Flashcards');

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
                if (budget.fixedCostGroups) {
                    localStorage.setItem('mybudget_fixedcostgroups', JSON.stringify(budget.fixedCostGroups));
                }
                importedProjects.push('Budget');
            }

            if (selection.audioNotes && audioNotesFile) {
                const content = await audioNotesFile.async('string');
                const audioNotesData = JSON.parse(content);
                const notes = (audioNotesData.data || []).map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
                localStorage.setItem('audio_notes_entries', JSON.stringify(notes));
                importedProjects.push('AudioNotes');
            }

            if (selection.recentlyPlayed && recentlyPlayedFile) {
                const content = await recentlyPlayedFile.async('string');
                const recentlyPlayedData = JSON.parse(content);
                localStorage.setItem('youtube_url_history', JSON.stringify(recentlyPlayedData.data || []));
                importedProjects.push('Zuletzt gespielt');
            }

            if (selection.flashcards && flashcardsFile) {
                const content = await flashcardsFile.async('string');
                const importData = JSON.parse(content);
                if (importData.data) {
                    if (importData.data.cards) {
                        localStorage.setItem('flashcards_data', JSON.stringify(importData.data.cards));
                    }
                    if (importData.data.decks) {
                        localStorage.setItem('flashcards_decks', JSON.stringify(importData.data.decks));
                    }
                    importedProjects.push('Flashcards');
                }
            }

            this.onClose();
            alert(`Import erfolgreich!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);
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

        if (selection.bookmarks && data.projects.bookmarks) {
            const bookmarks = data.projects.bookmarks.map((b: any) => ({
                ...b,
                createdAt: b.createdAt || Date.now()
            }));
            this.bookmarkService.importBookmarks(bookmarks, true);
            importedProjects.push('Lesezeichen');
        }

        if (selection.journal && data.projects.journal) {
            const entries = data.projects.journal.map((e: any) => ({
                ...e,
                date: new Date(e.date)
            }));
            localStorage.setItem('terminal_journal_entries', JSON.stringify(entries));
            importedProjects.push('Journal');
        }

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
            if (budget.fixedCostGroups) {
                localStorage.setItem('mybudget_fixedcostgroups', JSON.stringify(budget.fixedCostGroups));
            }
            importedProjects.push('Budget');
        }

        this.onClose();
        alert(`Import erfolgreich (Legacy-Format)!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);
        window.location.reload();
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
        if (selection.audioNotes) projectsToDelete.push('AudioNotes');
        if (selection.recentlyPlayed) projectsToDelete.push('Zuletzt gespielt');
        if (selection.flashcards) projectsToDelete.push('Flashcards');

        if (!confirm(`WARNUNG: Dies löscht ALLE Daten für:\n${projectsToDelete.join(', ')}\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nFortfahren?`)) {
            return;
        }

        if (!confirm('Sind Sie ABSOLUT sicher? Alle ausgewählten Daten werden unwiderruflich gelöscht!')) {
            return;
        }

        if (selection.bookmarks) {
            localStorage.removeItem('dev0gig_bookmarks');
        }

        if (selection.journal) {
            localStorage.removeItem('terminal_journal_entries');
        }

        if (selection.budget) {
            localStorage.removeItem('mybudget_transactions');
            localStorage.removeItem('mybudget_accounts');
            localStorage.removeItem('mybudget_categories');
            localStorage.removeItem('mybudget_fixedcosts');
            localStorage.removeItem('mybudget_fixedcostgroups');
        }

        if (selection.audioNotes) {
            localStorage.removeItem('audio_notes_entries');
        }

        if (selection.recentlyPlayed) {
            localStorage.removeItem('youtube_url_history');
        }

        if (selection.flashcards) {
            localStorage.removeItem('flashcards_data');
            localStorage.removeItem('flashcards_decks');
        }

        this.onClose();
        alert(`Gelöscht: ${projectsToDelete.join(', ')}\n\nDie Seite wird neu geladen.`);
        window.location.reload();
    }
}
