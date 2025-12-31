import { Component, inject, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { MtgInventoryService } from './mtg-inventory.service';
import { MtgCardBasic, getCardKey } from './mtg-card.model';
import { LazyCardDirective } from './lazy-card.directive';
import { MtgFilterComponent } from './components/mtg-filter/mtg-filter.component';

import { MtgCardDetailModalComponent } from './components/mtg-card-detail-modal/mtg-card-detail-modal.component';
import { MtgImportModalComponent } from './components/mtg-import-modal/mtg-import-modal.component';

@Component({
    selector: 'app-mtg-inventory',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule, AppsLauncher, LazyCardDirective, MtgFilterComponent, MtgCardDetailModalComponent, MtgImportModalComponent],
    templateUrl: './mtg-inventory.component.html'
})
export class MtgInventoryComponent {
    protected inventoryService = inject(MtgInventoryService);
    private sidebarService = inject(SidebarService);



    // --- Signals from Service ---
    cards = this.inventoryService.cards;
    cacheVersion = this.inventoryService.cacheVersion;

    // --- Local UI State ---
    searchTerm = signal<string>('');
    selectedSet = signal<string | null>(null);
    selectedRarity = signal<string | null>(null);
    currentPage = signal<number>(1);
    readonly pageSize = 50;

    showSettingsModal = signal<boolean>(false);
    showImportModal = signal<boolean>(false);
    showDetailModal = signal<{ card: MtgCardBasic; index: number } | null>(null);

    // Import state moved to MtgImportModalComponent
    // Detail view state moved to MtgCardDetailModalComponent
    toastMessage = signal<string>('');
    toastType = signal<'success' | 'error'>('success');

    constructor() {
        // Effect to ensure set names are loaded for each unique set
        effect(() => {
            const cards = this.cards();
            const seenSets = new Set<string>();

            for (const card of cards) {
                if (!seenSets.has(card.set)) {
                    seenSets.add(card.set);
                    // Queue fetch for one card from this set to get the set name
                    this.inventoryService.queueFetch(card.set, card.collectorNumber);
                }
            }
        });
    }

    // --- Computed Values ---

    /** All unique sets with count */
    allSets = computed(() => {
        const setMap = new Map<string, { code: string; name: string; count: number }>();

        for (const card of this.cards()) {
            const details = this.inventoryService.getDetails(card.set, card.collectorNumber);
            const existing = setMap.get(card.set);
            if (existing) {
                existing.count++;
            } else {
                setMap.set(card.set, {
                    code: card.set,
                    name: details?.setName || card.set,
                    count: 1
                });
            }
        }

        // Sort alphabetically by set code
        return Array.from(setMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    });

    /** Cards filtered by search and set - grouped by unique card key */
    filteredCards = computed(() => {
        this.cacheVersion();

        const term = this.searchTerm().toLowerCase().trim();
        const setFilter = this.selectedSet();
        const rarityFilter = this.selectedRarity();

        // First, group all cards by unique key to avoid duplicates
        const cardMap = new Map<string, { card: MtgCardBasic; index: number }>();

        this.cards().forEach((card, index) => {
            const key = getCardKey(card.set, card.collectorNumber);
            // Only keep the first occurrence (use the earliest index for reference)
            if (!cardMap.has(key)) {
                cardMap.set(key, { card, index });
            }
        });

        let filtered = Array.from(cardMap.values());

        // Filter by set
        if (setFilter) {
            filtered = filtered.filter(({ card }) => card.set === setFilter);
        }

        // Filter by rarity
        if (rarityFilter) {
            filtered = filtered.filter(({ card }) => {
                const details = this.inventoryService.getDetails(card.set, card.collectorNumber);
                return details?.rarity === rarityFilter;
            });
        }

        // Filter by search term
        if (term) {
            filtered = filtered.filter(({ card }) => {
                const details = this.inventoryService.getDetails(card.set, card.collectorNumber);
                const nameDE = details?.nameDE || '';
                return card.nameEN.toLowerCase().includes(term) ||
                    nameDE.toLowerCase().includes(term) ||
                    card.set.toLowerCase().includes(term) ||
                    card.collectorNumber.includes(term);
            });
        }

        return [...filtered].reverse();
    });

    /** Last 5 cards with images */
    recentCards = computed(() => this.filteredCards().slice(0, 5));

    /** Cards for current page (table view) */
    tableCards = computed(() => {
        const start = 5 + (this.currentPage() - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredCards().slice(start, end);
    });

    /** Total pages */
    totalPages = computed(() => {
        const remaining = Math.max(0, this.filteredCards().length - 5);
        return Math.ceil(remaining / this.pageSize);
    });

    /** Total remaining cards (after recent 5) */
    remainingCount = computed(() => Math.max(0, this.filteredCards().length - 5));

    /** Total filtered cards count including quantities */
    filteredCardsTotal = computed(() => {
        return this.filteredCards().reduce((sum, { card }) => {
            return sum + this.inventoryService.getCardCount(card.set, card.collectorNumber);
        }, 0);
    });

    totalCards = computed(() => this.inventoryService.getTotalCards());
    uniqueSets = computed(() => this.inventoryService.getUniqueSets());

    // --- Helper Methods ---

    getDetails(card: MtgCardBasic) {
        return this.inventoryService.getDetails(card.set, card.collectorNumber);
    }

    isLoading(card: MtgCardBasic): boolean {
        return this.inventoryService.isLoading(card.set, card.collectorNumber);
    }

    onCardVisible(card: MtgCardBasic): void {
        this.inventoryService.queueFetch(card.set, card.collectorNumber);
    }

    getCardKey(card: MtgCardBasic): string {
        return getCardKey(card.set, card.collectorNumber);
    }

    getCardCount(card: MtgCardBasic): number {
        return this.inventoryService.getCardCount(card.set, card.collectorNumber);
    }

    // --- Set Filter ---
    selectSet(setCode: string | null): void {
        this.selectedSet.set(setCode);
        this.currentPage.set(1);
    }

    // --- Rarity Filter ---
    selectRarity(rarity: string | null): void {
        this.selectedRarity.set(rarity);
        this.currentPage.set(1);
    }

    // --- Pagination ---
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    nextPage(): void {
        this.goToPage(this.currentPage() + 1);
    }

    prevPage(): void {
        this.goToPage(this.currentPage() - 1);
    }

    // --- Header Actions ---
    toggleSettingsModal(): void {
        this.showSettingsModal.update(v => !v);
    }

    toggleRightSidebar(): void {
        this.sidebarService.toggleRight();
    }

    // --- Card Actions ---
    // addCard moved to child component




    openDetailModal(card: MtgCardBasic, index: number): void {
        this.inventoryService.queueFetch(card.set, card.collectorNumber);
        // Fetch prices specifically for detail view
        this.inventoryService.fetchPricesForDetailView(card.set, card.collectorNumber);
        this.showDetailModal.set({ card, index });
    }

    closeDetailModal(): void {
        this.showDetailModal.set(null);
    }

    // isRefreshingPrices, refreshPrices moved to child component

    // --- Import/Export ---
    openImportModal(): void {
        this.showImportModal.set(true);
        this.showSettingsModal.set(false);
    }

    closeImportModal(): void {
        this.showImportModal.set(false);
    }

    // executeImport moved to child component

    exportCollection(): void {
        const text = this.inventoryService.exportToArenaFormat();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mtg-collection.txt';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Export gestartet!', 'success');
    }

    async copyExport(): Promise<void> {
        try {
            const text = this.inventoryService.exportToArenaFormat();
            await navigator.clipboard.writeText(text);
            this.showToast('In Zwischenablage kopiert!', 'success');
        } catch {
            this.showToast('Kopieren fehlgeschlagen.', 'error');
        }
    }

    // --- Toast ---
    handleToast(event: { message: string, type: 'success' | 'error' }): void {
        this.showToast(event.message, event.type);
    }

    private showToast(message: string, type: 'success' | 'error'): void {
        this.toastMessage.set(message);
        this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 3000);
    }

    hideToast(): void {
        this.toastMessage.set('');
    }

    // --- Clear ---
    clearCollection(): void {
        if (confirm('Gesamte Sammlung löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            this.inventoryService.clearCollection();
            this.showToast('Sammlung gelöscht.', 'success');
        }
    }

    clearCache(): void {
        if (confirm('Cache löschen? Bilder werden beim nächsten Anzeigen neu geladen.')) {
            this.inventoryService.clearCache();
            this.showToast('Cache gelöscht.', 'success');
        }
    }
}
