import { Injectable, inject } from '@angular/core';
import { BookmarkService } from './bookmark.service';
import { FlashcardsService } from '../features/flashcards/flashcards.service';

export interface ProjectSelection {
    bookmarks: boolean;
    journal: boolean;
    budget: boolean;
    recentlyPlayed: boolean;
    flashcards: boolean;
    mtgInventory: boolean;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
    private bookmarkService = inject(BookmarkService);
    private flashcardsService = inject(FlashcardsService);

    /**
     * Generate backup filename with current date
     */
    private generateFilename(): string {
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        return `${dateStr}_TOOLS-backup.zip`;
    }

    /**
     * Export all data (used by keyboard shortcut)
     */
    async exportAllData(): Promise<void> {
        const selection: ProjectSelection = {
            bookmarks: true,
            journal: true,
            budget: true,
            recentlyPlayed: true,
            flashcards: true,
            mtgInventory: true
        };
        await this.exportSelectedData(selection);
    }

    /**
     * Export selected projects data
     */
    async exportSelectedData(selection: ProjectSelection): Promise<string[]> {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const exportDate = new Date().toISOString();
        const exportedProjects: string[] = [];

        if (selection.bookmarks) {
            const bookmarks = this.bookmarkService.bookmarks();
            const bookmarksData = {
                exportDate,
                version: '1.0',
                project: 'bookmarks',
                data: bookmarks
            };
            zip.file('bookmarks.json', JSON.stringify(bookmarksData, null, 2));
            exportedProjects.push('Lesezeichen');
        }

        if (selection.journal) {
            const journalEntries = localStorage.getItem('terminal_journal_entries');
            const journalData = {
                exportDate,
                version: '1.0',
                project: 'journal',
                data: journalEntries ? JSON.parse(journalEntries) : []
            };
            zip.file('journal.json', JSON.stringify(journalData, null, 2));
            exportedProjects.push('Journal');
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
            exportedProjects.push('Budget');
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
            exportedProjects.push('Zuletzt gespielt');
        }

        if (selection.flashcards) {
            const flashcardsExport = this.flashcardsService.exportData();
            const exportData = {
                exportDate,
                version: '1.0',
                project: 'flashcards',
                data: flashcardsExport
            };
            zip.file('flashcards.json', JSON.stringify(exportData, null, 2));
            exportedProjects.push('Flashcards');
        }

        if (selection.mtgInventory) {
            const mtgCards = localStorage.getItem('mtg-cards');
            const mtgCache = localStorage.getItem('mtg-cache');
            const mtgData = {
                exportDate,
                version: '1.0',
                project: 'mtgInventory',
                data: {
                    cards: mtgCards ? JSON.parse(mtgCards) : [],
                    cache: mtgCache ? JSON.parse(mtgCache) : {}
                }
            };
            zip.file('mtginventory.json', JSON.stringify(mtgData, null, 2));
            exportedProjects.push('MTG Inventory');
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateFilename();
        a.click();
        window.URL.revokeObjectURL(url);

        return exportedProjects;
    }

    /**
     * Trigger file picker for import
     */
    triggerImport(onFileSelected: (file: File) => void): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                onFileSelected(file);
            }
        };
        input.click();
    }

    /**
     * Import all data from ZIP file
     */
    async importAllData(file: File): Promise<string[]> {
        const selection: ProjectSelection = {
            bookmarks: true,
            journal: true,
            budget: true,
            recentlyPlayed: true,
            flashcards: true,
            mtgInventory: true
        };
        return this.importSelectedData(file, selection);
    }

    /**
     * Import selected projects from ZIP file
     */
    async importSelectedData(file: File, selection: ProjectSelection): Promise<string[]> {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        const importedProjects: string[] = [];

        const bookmarksFile = zip.file('bookmarks.json');
        const journalFile = zip.file('journal.json');
        const budgetFile = zip.file('budget.json');
        const recentlyPlayedFile = zip.file('recentlyplayed.json');
        const flashcardsFile = zip.file('flashcards.json');
        const mtgInventoryFile = zip.file('mtginventory.json');
        const legacyFile = zip.file('dashboard_backup.json');

        // Handle legacy format
        if (legacyFile && !bookmarksFile && !journalFile && !budgetFile) {
            return this.processLegacyImport(legacyFile, selection);
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
                const cardsToImport = Array.isArray(importData.data.cards) ? importData.data.cards : [];
                const decksToImport = Array.isArray(importData.data.decks) ? importData.data.decks : [];
                this.flashcardsService.importData({
                    cards: cardsToImport,
                    decks: decksToImport
                });
                importedProjects.push('Flashcards');
            }
        }

        if (selection.mtgInventory && mtgInventoryFile) {
            const content = await mtgInventoryFile.async('string');
            const mtgData = JSON.parse(content);
            if (mtgData.data) {
                if (mtgData.data.cards) {
                    localStorage.setItem('mtg-cards', JSON.stringify(mtgData.data.cards));
                }
                if (mtgData.data.cache) {
                    localStorage.setItem('mtg-cache', JSON.stringify(mtgData.data.cache));
                }
                importedProjects.push('MTG Inventory');
            }
        }

        return importedProjects;
    }

    /**
     * Process legacy backup format
     */
    private async processLegacyImport(legacyFile: any, selection: ProjectSelection): Promise<string[]> {
        const content = await legacyFile.async('string');
        const data = JSON.parse(content);
        const importedProjects: string[] = [];

        if (!data.projects) {
            return [];
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

        return importedProjects;
    }

    /**
     * Check which projects are available in a ZIP file
     */
    async getAvailableProjects(file: File): Promise<string[]> {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        const available: string[] = [];

        if (zip.file('bookmarks.json')) available.push('bookmarks');
        if (zip.file('journal.json')) available.push('journal');
        if (zip.file('budget.json')) available.push('budget');
        if (zip.file('recentlyplayed.json')) available.push('recentlyPlayed');
        if (zip.file('flashcards.json')) available.push('flashcards');
        if (zip.file('mtginventory.json')) available.push('mtgInventory');
        if (zip.file('dashboard_backup.json')) available.push('legacy');

        return available;
    }
}
