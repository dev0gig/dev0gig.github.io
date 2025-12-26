import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject, BehaviorSubject } from 'rxjs';
import { debounceTime, concatMap, filter } from 'rxjs/operators';
import { MtgCardBasic, MtgCardDetails, ScryfallCard, getCardKey } from './mtg-card.model';

@Injectable({
    providedIn: 'root'
})
export class MtgInventoryService {
    private readonly STORAGE_KEY_CARDS = 'mtg-cards';
    private readonly STORAGE_KEY_CACHE = 'mtg-cache';
    private readonly API_BASE = 'https://api.scryfall.com/cards';
    private readonly RATE_LIMIT_MS = 100;

    private http = inject(HttpClient);

    /** Reactive signal for the basic card collection */
    cards = signal<MtgCardBasic[]>(this.loadCardsFromStorage());

    /** Cache for fetched card details */
    private detailsCache = new Map<string, MtgCardDetails>(this.loadCacheFromStorage());

    /** Reactive signal for cache updates (triggers re-render) */
    cacheVersion = signal<number>(0);

    /** Loading state per card */
    loadingCards = signal<Set<string>>(new Set());

    /** Import progress tracking */
    importProgress = signal<{ current: number; total: number } | null>(null);

    /** Request queue for debounced API calls */
    private fetchQueue = new Subject<{ set: string; collectorNumber: string }>();
    private pendingRequests = new Set<string>();

    constructor() {
        // Process fetch queue with rate limiting
        this.fetchQueue.pipe(
            filter(req => {
                const key = getCardKey(req.set, req.collectorNumber);
                // Skip if already cached or pending
                if (this.detailsCache.has(key) || this.pendingRequests.has(key)) {
                    return false;
                }
                this.pendingRequests.add(key);
                return true;
            }),
            concatMap(async req => {
                await this.delay(this.RATE_LIMIT_MS);
                return this.fetchDetailsFromApi(req.set, req.collectorNumber);
            })
        ).subscribe();
    }

    // --- Storage Operations ---

    private loadCardsFromStorage(): MtgCardBasic[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY_CARDS);
            return stored ? JSON.parse(stored) : [];
        } catch {
            console.error('Failed to load MTG cards from localStorage');
            return [];
        }
    }

    private saveCardsToStorage(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY_CARDS, JSON.stringify(this.cards()));
        } catch {
            console.error('Failed to save MTG cards to localStorage');
        }
    }

    private loadCacheFromStorage(): [string, MtgCardDetails][] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY_CACHE);
            if (stored) {
                const parsed = JSON.parse(stored);
                return Object.entries(parsed) as [string, MtgCardDetails][];
            }
        } catch {
            console.error('Failed to load MTG cache from localStorage');
        }
        return [];
    }

    private saveCacheToStorage(): void {
        try {
            const obj = Object.fromEntries(this.detailsCache);
            localStorage.setItem(this.STORAGE_KEY_CACHE, JSON.stringify(obj));
        } catch {
            console.error('Failed to save MTG cache to localStorage');
        }
    }

    // --- Lazy Loading API ---

    /**
     * Get cached details for a card (returns undefined if not cached)
     */
    getDetails(set: string, collectorNumber: string): MtgCardDetails | undefined {
        const key = getCardKey(set, collectorNumber);
        return this.detailsCache.get(key);
    }

    /**
     * Check if a card is currently being fetched
     */
    isLoading(set: string, collectorNumber: string): boolean {
        const key = getCardKey(set, collectorNumber);
        return this.loadingCards().has(key);
    }

    /**
     * Queue a card for lazy fetching (called when card enters viewport)
     */
    queueFetch(set: string, collectorNumber: string): void {
        const key = getCardKey(set, collectorNumber);

        // Skip if already cached
        if (this.detailsCache.has(key)) {
            return;
        }

        // Mark as loading
        this.loadingCards.update(s => {
            const newSet = new Set(s);
            newSet.add(key);
            return newSet;
        });

        // Add to queue
        this.fetchQueue.next({ set, collectorNumber });
    }

    /**
     * Fetch card details from Scryfall API
     */
    private async fetchDetailsFromApi(set: string, collectorNumber: string): Promise<void> {
        const key = getCardKey(set, collectorNumber);
        const setCode = set.toLowerCase();

        try {
            let germanCard: ScryfallCard | null = null;
            let englishCard: ScryfallCard | null = null;

            // Try German version first
            try {
                germanCard = await firstValueFrom(
                    this.http.get<ScryfallCard>(`${this.API_BASE}/${setCode}/${collectorNumber}/de`)
                );
            } catch {
                // German version not available
            }

            // Fetch English for fallback
            try {
                englishCard = await firstValueFrom(
                    this.http.get<ScryfallCard>(`${this.API_BASE}/${setCode}/${collectorNumber}`)
                );
            } catch {
                // Card not found
            }

            if (englishCard) {
                const details: MtgCardDetails = {
                    nameDE: germanCard?.printed_name || germanCard?.name || englishCard.name,
                    setName: englishCard.set_name,
                    imageUrl: this.extractImageUrl(germanCard || englishCard),
                    fetchedAt: Date.now(),
                    priceEur: englishCard.prices?.eur ?? null,
                    priceEurFoil: englishCard.prices?.eur_foil ?? null,
                    priceUsd: englishCard.prices?.usd ?? null,
                    priceUsdFoil: englishCard.prices?.usd_foil ?? null,
                    rarity: englishCard.rarity,
                    manaCost: englishCard.mana_cost || englishCard.card_faces?.[0]?.mana_cost || null,
                    legalities: englishCard.legalities ? {
                        standard: englishCard.legalities.standard,
                        modern: englishCard.legalities.modern,
                        commander: englishCard.legalities.commander,
                        legacy: englishCard.legalities.legacy,
                        pioneer: englishCard.legalities.pioneer,
                        pauper: englishCard.legalities.pauper
                    } : undefined,
                    cardmarketUrl: englishCard.purchase_uris?.cardmarket
                };

                // Store in cache
                this.detailsCache.set(key, details);
                this.saveCacheToStorage();

                // Trigger re-render
                this.cacheVersion.update(v => v + 1);
            }
        } finally {
            // Remove from loading and pending
            this.loadingCards.update(s => {
                const newSet = new Set(s);
                newSet.delete(key);
                return newSet;
            });
            this.pendingRequests.delete(key);
        }
    }

    private extractImageUrl(card: ScryfallCard): string {
        if (card.image_uris?.normal) {
            return card.image_uris.normal;
        }
        if (card.card_faces?.[0]?.image_uris?.normal) {
            return card.card_faces[0].image_uris.normal;
        }
        if (card.image_uris?.small) {
            return card.image_uris.small;
        }
        return '';
    }

    /**
     * Fetch prices for a specific card (called when opening detail modal)
     * Only fetches if prices are not already cached
     */
    async fetchPricesForDetailView(set: string, collectorNumber: string): Promise<void> {
        const key = getCardKey(set, collectorNumber);
        const cached = this.detailsCache.get(key);

        // If we already have prices, don't fetch again
        if (cached && (cached.priceEur !== undefined || cached.priceUsd !== undefined)) {
            return;
        }

        await this.refreshPricesForDetailView(set, collectorNumber);
    }

    /**
     * Force refresh prices for a specific card (bypasses cache check)
     * Called when user clicks the refresh price button in detail modal
     */
    async refreshPricesForDetailView(set: string, collectorNumber: string): Promise<void> {
        const key = getCardKey(set, collectorNumber);
        const cached = this.detailsCache.get(key);
        const setCode = set.toLowerCase();

        try {
            const englishCard = await firstValueFrom(
                this.http.get<ScryfallCard>(`${this.API_BASE}/${setCode}/${collectorNumber}`)
            );

            if (englishCard && cached) {
                // Update existing cache with prices
                cached.priceEur = englishCard.prices?.eur ?? null;
                cached.priceEurFoil = englishCard.prices?.eur_foil ?? null;
                cached.priceUsd = englishCard.prices?.usd ?? null;
                cached.priceUsdFoil = englishCard.prices?.usd_foil ?? null;
                cached.fetchedAt = Date.now();

                this.detailsCache.set(key, cached);
                this.saveCacheToStorage();
                this.cacheVersion.update(v => v + 1);
            }
        } catch (error) {
            console.warn('Failed to fetch price data:', error);
        }
    }

    // --- Collection Management ---

    /**
     * Add a card manually (with instant API fetch for single cards)
     */
    async addCardManually(set: string, collectorNumber: string): Promise<boolean> {
        const setCode = set.toUpperCase();

        // Try to get English name from API first
        try {
            const englishCard = await firstValueFrom(
                this.http.get<ScryfallCard>(`${this.API_BASE}/${set.toLowerCase()}/${collectorNumber}`)
            );

            const card: MtgCardBasic = {
                set: setCode,
                collectorNumber,
                nameEN: englishCard.name
            };

            this.cards.update(cards => [...cards, card]);
            this.saveCardsToStorage();

            // Also cache the details immediately
            await this.fetchDetailsFromApi(setCode, collectorNumber);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove a card from the collection by index
     */
    removeCardByIndex(index: number): void {
        this.cards.update(cards => cards.filter((_, i) => i !== index));
        this.saveCardsToStorage();
    }

    /**
     * Clear entire collection (keeps cache)
     */
    clearCollection(): void {
        this.cards.set([]);
        this.saveCardsToStorage();
    }

    /**
     * Clear cache only
     */
    clearCache(): void {
        this.detailsCache.clear();
        localStorage.removeItem(this.STORAGE_KEY_CACHE);
        this.cacheVersion.update(v => v + 1);
    }

    // --- Import/Export (Arena Format) ---

    /**
     * Lightweight import - NO API calls, just parse and store
     */
    importFromArenaFormat(input: string): { success: number; failed: number } {
        const lines = input.trim().split('\n').filter(line => line.trim());
        const pattern = /^(\d+)\s+(.+?)\s+\(([A-Z0-9]+)\)\s+(\S+)$/i;

        let success = 0;
        let failed = 0;

        const newCards: MtgCardBasic[] = [];

        for (const line of lines) {
            const match = line.trim().match(pattern);
            if (match) {
                const quantity = parseInt(match[1], 10);
                const nameEN = match[2];
                const set = match[3].toUpperCase();
                const collectorNumber = match[4].replace(/★$/, '');

                // Add card multiple times for quantity
                for (let i = 0; i < quantity; i++) {
                    newCards.push({ set, collectorNumber, nameEN });
                }
                success += quantity;
            } else {
                failed++;
            }
        }

        // Append to existing cards
        this.cards.update(cards => [...cards, ...newCards]);
        this.saveCardsToStorage();

        return { success, failed };
    }

    /**
     * Export collection to Arena format
     */
    exportToArenaFormat(): string {
        // Group cards by set+number to count duplicates
        const grouped = new Map<string, { card: MtgCardBasic; count: number }>();

        for (const card of this.cards()) {
            const key = getCardKey(card.set, card.collectorNumber);
            const existing = grouped.get(key);
            if (existing) {
                existing.count++;
            } else {
                grouped.set(key, { card, count: 1 });
            }
        }

        return Array.from(grouped.values())
            .map(({ card, count }) => `${count} ${card.nameEN} (${card.set}) ${card.collectorNumber}`)
            .join('\n');
    }

    // --- Statistics ---

    getTotalCards(): number {
        return this.cards().length;
    }

    getUniqueCards(): number {
        const unique = new Set(this.cards().map(c => getCardKey(c.set, c.collectorNumber)));
        return unique.size;
    }

    getUniqueSets(): number {
        return new Set(this.cards().map(c => c.set)).size;
    }

    /**
     * Get count of a specific card in the collection
     */
    getCardCount(set: string, collectorNumber: string): number {
        return this.cards().filter(c =>
            c.set.toUpperCase() === set.toUpperCase() &&
            c.collectorNumber === collectorNumber
        ).length;
    }

    /**
     * Update quantity of a card (add or remove copies)
     * @param set Set code
     * @param collectorNumber Collector number
     * @param delta Change in quantity (+1 to add, -1 to remove)
     */
    updateCardQuantity(set: string, collectorNumber: string, delta: number): void {
        const setCode = set.toUpperCase();

        if (delta > 0) {
            // Add copies
            const existingCard = this.cards().find(c =>
                c.set.toUpperCase() === setCode &&
                c.collectorNumber === collectorNumber
            );

            if (existingCard) {
                // Use existing card data
                for (let i = 0; i < delta; i++) {
                    this.cards.update(cards => [...cards, { ...existingCard }]);
                }
            }
        } else if (delta < 0) {
            // Remove copies
            const removeCount = Math.abs(delta);
            let removed = 0;

            this.cards.update(cards => {
                const newCards = [...cards];
                for (let i = newCards.length - 1; i >= 0 && removed < removeCount; i--) {
                    if (newCards[i].set.toUpperCase() === setCode &&
                        newCards[i].collectorNumber === collectorNumber) {
                        newCards.splice(i, 1);
                        removed++;
                    }
                }
                return newCards;
            });
        }

        this.saveCardsToStorage();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
