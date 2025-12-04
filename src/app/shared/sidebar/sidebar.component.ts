import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PwaService } from '../pwa.service';
import { BookmarkService } from '../bookmark.service';
import { SidebarService } from '../sidebar.service';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    pwa = inject(PwaService);
    bookmarkService = inject(BookmarkService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    private router = inject(Router);

    toggleSidebar() {
        this.sidebarService.toggle();
    }

    onSettingsClick() {
        this.settingsService.openSettings();
    }

    installPwa() {
        this.pwa.installPwa();
        this.sidebarService.close();
    }

    downloadMangaBuilder() {
        if (confirm('Möchten Sie das Manga Builder Tool herunterladen?')) {
            const link = document.createElement('a');
            link.href = 'manga_builder_gui.exe';
            link.download = 'manga_builder_gui.exe';
            link.click();
            this.sidebarService.close();
        }
    }

    downloadAudioNotes() {
        if (confirm('Möchten Sie die AudioNotes App herunterladen?')) {
            const link = document.createElement('a');
            link.href = 'audionotes.apk';
            link.download = 'audionotes.apk';
            link.click();
            this.sidebarService.close();
        }
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

        this.sidebarService.close();
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

            if (!bookmarksFile && !journalFile && !budgetFile) {
                alert('Keine passenden Daten in der Backup-Datei gefunden.');
                return;
            }

            if (!confirm('Warnung: Der Import überschreibt alle bestehenden Daten.\\n\\nFortfahren?')) {
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

            this.sidebarService.close();
            alert(`Import erfolgreich!\\nImportierte Projekte: ${importedProjects.join(', ')}\\n\\nBitte laden Sie die Seite neu, um alle Änderungen zu sehen.`);

            // Reload to apply changes
            window.location.reload();
        } catch (e) {
            console.error('Import failed', e);
            alert('Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
        }
    }
}
