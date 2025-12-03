import { Component, signal, output, inject, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PwaService } from '../pwa.service';
import { BookmarkService } from '../bookmark.service';

// Import JournalService dynamically to avoid circular dependencies
interface JournalEntry {
    id: string;
    date: Date;
    content: string;
    mood?: string;
    tags?: string[];
}

@Component({
    selector: 'app-apps-launcher',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './apps-launcher.html',
    styleUrl: './apps-launcher.css'
})
export class AppsLauncher implements OnInit, OnDestroy {
    pwa = inject(PwaService);
    bookmarkService = inject(BookmarkService);
    showAppsModal = signal(false);
    openSettings = output<void>();

    private keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event);

    ngOnInit() {
        document.addEventListener('keydown', this.keydownHandler);
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.keydownHandler);
    }

    private handleKeydown(event: KeyboardEvent) {
        // Ctrl+E for Export
        if (event.ctrlKey && event.key === 'e') {
            event.preventDefault();
            this.exportAllData();
        }
        // Ctrl+I for Import
        if (event.ctrlKey && event.key === 'i') {
            event.preventDefault();
            this.triggerImportAll();
        }
    }

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

    async exportAllData() {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const exportDate = new Date().toISOString();

        // Export Bookmarks
        const bookmarks = this.bookmarkService.bookmarks();
        const bookmarksData = {
            exportDate,
            version: '1.0',
            project: 'bookmarks',
            data: bookmarks
        };
        zip.file('bookmarks.json', JSON.stringify(bookmarksData, null, 2));

        // Export Journal
        const journalEntries = localStorage.getItem('terminal_journal_entries');
        if (journalEntries) {
            const journalData = {
                exportDate,
                version: '1.0',
                project: 'journal',
                data: JSON.parse(journalEntries)
            };
            zip.file('journal.json', JSON.stringify(journalData, null, 2));
        }

        // Export Budget
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

        // Generate and download
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_backup_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showAppsModal.set(false);
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

            const importedProjects: string[] = [];

            // Check which files exist in the ZIP
            const bookmarksFile = zip.file('bookmarks.json');
            const journalFile = zip.file('journal.json');
            const budgetFile = zip.file('budget.json');

            // Also check for legacy format (dashboard_backup.json)
            const legacyFile = zip.file('dashboard_backup.json');

            // If no new format files found, try legacy format
            if (!bookmarksFile && !journalFile && !budgetFile && legacyFile) {
                await this.processLegacyImport(legacyFile);
                return;
            }

            if (!bookmarksFile && !journalFile && !budgetFile) {
                alert('Keine passenden Daten in der Backup-Datei gefunden.');
                return;
            }

            if (!confirm('Warnung: Der Import überschreibt alle bestehenden Daten.\n\nFortfahren?')) {
                return;
            }

            // Import Bookmarks
            if (bookmarksFile) {
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
            if (journalFile) {
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
            if (budgetFile) {
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

            this.showAppsModal.set(false);
            alert(`Import erfolgreich!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);

            // Reload to apply changes
            window.location.reload();
        } catch (e) {
            console.error('Import failed', e);
            alert('Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
        }
    }

    private async processLegacyImport(legacyFile: any) {
        const content = await legacyFile.async('string');
        const data = JSON.parse(content);

        if (!data.projects) {
            alert('Ungültige Backup-Datei: Keine Projektdaten gefunden.');
            return;
        }

        const importedProjects: string[] = [];

        if (!confirm('Warnung: Der Import überschreibt alle bestehenden Daten.\n\nFortfahren?')) {
            return;
        }

        // Import Bookmarks
        if (data.projects.bookmarks) {
            const bookmarks = data.projects.bookmarks.map((b: any) => ({
                ...b,
                createdAt: b.createdAt || Date.now()
            }));
            this.bookmarkService.importBookmarks(bookmarks, true);
            importedProjects.push('Lesezeichen');
        }

        // Import Journal
        if (data.projects.journal) {
            const entries = data.projects.journal.map((e: any) => ({
                ...e,
                date: new Date(e.date)
            }));
            localStorage.setItem('terminal_journal_entries', JSON.stringify(entries));
            importedProjects.push('Journal');
        }

        // Import Budget
        if (data.projects.budget) {
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

        this.showAppsModal.set(false);
        alert(`Import erfolgreich (Legacy-Format)!\nImportierte Projekte: ${importedProjects.join(', ')}\n\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);

        window.location.reload();
    }
}
