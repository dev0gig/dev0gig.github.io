import { Injectable, inject } from '@angular/core';
import { BookmarkService } from './bookmark.service';
import { FlashcardsService } from '../features/flashcards/flashcards.service';
import { JournalService } from '../features/journal/journal';
import { BudgetDataService } from '../features/budget/services/budget-data.service';
import { STORAGE_KEYS } from '../core/storage-keys.const';

export interface ProjectSelection {
    bookmarks: boolean;
    journal: boolean;
    budget: boolean;
    recentlyPlayed: boolean;
    flashcards: boolean;
    mtgInventory: boolean;
}

interface BackupData<T> {
    exportDate: string;
    version: string;
    project: string;
    data: T;
}

interface BookmarkDTO {
    id: string;
    // other properties if needed, for now just partial
    createdAt?: number;
    [key: string]: any; // Allow loose typing for now as we transition
}

interface JournalEntryDTO {
    id: string;
    date: string;
    text: string;
    tags: string[];
}

interface LegacyBackup {
    projects: {
        bookmarks?: any[];
        journal?: any[];
        budget?: any;
    };
}

@Injectable({ providedIn: 'root' })
export class BackupService {
    private bookmarkService = inject(BookmarkService);
    private flashcardsService = inject(FlashcardsService);
    private journalService = inject(JournalService);
    private budgetDataService = inject(BudgetDataService);

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
            const bookmarksData = {
                exportDate,
                version: '1.0',
                project: 'bookmarks',
                data: this.bookmarkService.getExportData()
            };
            zip.file('bookmarks.json', JSON.stringify(bookmarksData, null, 2));
            exportedProjects.push('Lesezeichen');
        }

        if (selection.journal) {
            const journalData = {
                exportDate,
                version: '1.0',
                project: 'journal',
                data: this.journalService.getBackupExportData()
            };
            zip.file('journal.json', JSON.stringify(journalData, null, 2));
            exportedProjects.push('Journal');
        }

        if (selection.budget) {
            const budgetData = {
                exportDate,
                version: '1.2',
                project: 'budget',
                data: this.budgetDataService.getExportData()
            };
            zip.file('budget.json', JSON.stringify(budgetData, null, 2));
            exportedProjects.push('Budget');
        }

        if (selection.recentlyPlayed) {
            const urlHistory = localStorage.getItem(STORAGE_KEYS.YOUTUBE);
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
            const mtgCards = localStorage.getItem(STORAGE_KEYS.MTG.CARDS);
            const mtgCache = localStorage.getItem(STORAGE_KEYS.MTG.CACHE);
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
            const dataWrapper = JSON.parse(content) as BackupData<BookmarkDTO[]>;
            const bookmarks = (dataWrapper.data || []).map((b) => ({
                ...b,
                createdAt: (b as any).createdAt || Date.now()
            }));
            this.bookmarkService.importBookmarks(bookmarks as any[], true);
            importedProjects.push('Lesezeichen');
        }

        if (selection.journal && journalFile) {
            const content = await journalFile.async('string');
            const dataWrapper = JSON.parse(content) as BackupData<JournalEntryDTO[]>;
            this.journalService.importBackupData(dataWrapper.data || []);
            importedProjects.push('Journal');
        }

        if (selection.budget && budgetFile) {
            const content = await budgetFile.async('string');
            const dataWrapper = JSON.parse(content) as BackupData<any>;
            this.budgetDataService.importData(dataWrapper.data || {});
            importedProjects.push('Budget');
        }

        if (selection.recentlyPlayed && recentlyPlayedFile) {
            const content = await recentlyPlayedFile.async('string');
            const dataWrapper = JSON.parse(content) as BackupData<any[]>;
            localStorage.setItem(STORAGE_KEYS.YOUTUBE, JSON.stringify(dataWrapper.data || []));
            importedProjects.push('Zuletzt gespielt');
        }

        if (selection.flashcards && flashcardsFile) {
            const content = await flashcardsFile.async('string');
            const importData = JSON.parse(content) as BackupData<{ cards: any[], decks: any[] }>;
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
            const mtgData = JSON.parse(content) as BackupData<any>;
            if (mtgData.data) {
                if (mtgData.data.cards) {
                    localStorage.setItem(STORAGE_KEYS.MTG.CARDS, JSON.stringify(mtgData.data.cards));
                }
                if (mtgData.data.cache) {
                    localStorage.setItem(STORAGE_KEYS.MTG.CACHE, JSON.stringify(mtgData.data.cache));
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
        const data = JSON.parse(content) as LegacyBackup;
        const importedProjects: string[] = [];

        if (!data.projects) {
            return [];
        }

        if (selection.bookmarks && data.projects.bookmarks) {
            const bookmarks = data.projects.bookmarks.map((b) => ({
                ...b,
                createdAt: (b as any).createdAt || Date.now()
            }));
            this.bookmarkService.importBookmarks(bookmarks as any[], true);
            importedProjects.push('Lesezeichen');
        }

        if (selection.journal && data.projects.journal) {
            this.journalService.importBackupData(data.projects.journal);
            importedProjects.push('Journal');
        }

        if (selection.budget && data.projects.budget) {
            this.budgetDataService.importData(data.projects.budget);
            importedProjects.push('Budget');
        }

        return importedProjects;
    }

    /**
     * Delete all data for selected projects
     */
    deleteAllData(selection: ProjectSelection): string[] {
        const deletedProjects: string[] = [];

        // Delete Bookmarks
        if (selection.bookmarks) {
            localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
            deletedProjects.push('Lesezeichen');
        }

        // Delete Journal
        if (selection.journal) {
            localStorage.removeItem(STORAGE_KEYS.JOURNAL);
            deletedProjects.push('Journal');
        }

        // Delete Budget
        if (selection.budget) {
            localStorage.removeItem(STORAGE_KEYS.BUDGET.TRANSACTIONS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.ACCOUNTS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.CATEGORIES);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.FIXED_COSTS);
            localStorage.removeItem(STORAGE_KEYS.BUDGET.FIXED_COST_GROUPS);
            deletedProjects.push('Budget');
        }

        // Delete RecentlyPlayed
        if (selection.recentlyPlayed) {
            localStorage.removeItem(STORAGE_KEYS.YOUTUBE);
            deletedProjects.push('Zuletzt gespielt');
        }

        // Delete Flashcards
        if (selection.flashcards) {
            this.flashcardsService.deleteAllData();
            deletedProjects.push('Flashcards');
        }

        // Delete MTG Inventory
        if (selection.mtgInventory) {
            localStorage.removeItem(STORAGE_KEYS.MTG.CARDS);
            localStorage.removeItem(STORAGE_KEYS.MTG.CACHE);
            deletedProjects.push('MTG Inventory');
        }

        return deletedProjects;
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
