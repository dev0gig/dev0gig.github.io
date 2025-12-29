import { Injectable, signal, computed } from '@angular/core';
import { Flashcard, Deck, createFlashcard, createDeck } from './flashcard.model';

const STORAGE_KEY = 'flashcards_data';
const DECKS_STORAGE_KEY = 'flashcards_decks';

@Injectable({ providedIn: 'root' })
export class FlashcardsService {
    private _cards = signal<Flashcard[]>(this.loadCards());
    private _decks = signal<Deck[]>(this.loadDecks());
    private _isRandomMode = signal<boolean>(false);
    private _isReversedMode = signal<boolean>(false);
    private _currentIndex = signal<number>(0);
    private _activeDeckId = signal<string | null>(null);

    // Public readonly signals
    readonly cards = this._cards.asReadonly();
    readonly decks = this._decks.asReadonly();
    readonly isRandomMode = this._isRandomMode.asReadonly();
    readonly isReversedMode = this._isReversedMode.asReadonly();
    readonly currentIndex = this._currentIndex.asReadonly();
    readonly activeDeckId = this._activeDeckId.asReadonly();


    /** Cards ordered by current mode (sequential or random) */
    readonly studyQueue = computed(() => {
        const cards = [...this._cards()];
        return this._isRandomMode() ? this.shuffleArray(cards) : cards;
    });

    readonly currentCard = computed(() => {
        const queue = this.studyQueue();
        const index = this._currentIndex();
        return queue[index] ?? null;
    });

    readonly totalCards = computed(() => this._cards().length);

    // --- Card Management ---

    addCard(front: string, back: string): void {
        if (!front.trim() || !back.trim()) return;
        const card = createFlashcard(front, back);
        this._cards.update(cards => [...cards, card]);
        this.saveCards();

        // Also add to active deck if one is selected
        const activeDeckId = this._activeDeckId();
        if (activeDeckId) {
            this._decks.update(decks =>
                decks.map(d => d.id === activeDeckId
                    ? { ...d, cards: [...d.cards, card] }
                    : d
                )
            );
            this.saveDecks();
        }
    }

    removeCard(id: string): void {
        this._cards.update(cards => cards.filter(c => c.id !== id));
        this.saveCards();
        if (this._currentIndex() >= this._cards().length) {
            this._currentIndex.set(Math.max(0, this._cards().length - 1));
        }
    }

    updateCard(id: string, front: string, back: string): void {
        this._cards.update(cards =>
            cards.map(c => c.id === id ? { ...c, front: front.trim(), back: back.trim() } : c)
        );
        this.saveCards();
    }


    clearAllCards(): void {
        this._cards.set([]);
        this._currentIndex.set(0);
        this._activeDeckId.set(null);
        this.saveCards();
    }

    // --- Deck Management ---

    saveDeck(name: string): Deck | null {
        const cards = this._cards();
        if (cards.length === 0 || !name.trim()) return null;

        const deck = createDeck(name, cards);
        this._decks.update(decks => [...decks, deck]);
        this._activeDeckId.set(deck.id);
        this.saveDecks();
        return deck;
    }

    createEmptyDeck(name: string): Deck | null {
        if (!name.trim()) return null;

        const deck = createDeck(name, []);
        this._decks.update(decks => [...decks, deck]);
        this._activeDeckId.set(deck.id);
        this._cards.set([]);
        this._currentIndex.set(0);
        this.saveCards();
        this.saveDecks();
        return deck;
    }

    loadDeck(deckId: string): void {
        const deck = this._decks().find(d => d.id === deckId);
        if (!deck) return;

        this._cards.set([...deck.cards]);
        this._currentIndex.set(0);
        this._activeDeckId.set(deck.id);
        this.saveCards();
    }

    deleteDeck(deckId: string): void {
        this._decks.update(decks => decks.filter(d => d.id !== deckId));
        if (this._activeDeckId() === deckId) {
            this._activeDeckId.set(null);
        }
        this.saveDecks();
    }

    renameDeck(deckId: string, newName: string): void {
        if (!newName.trim()) return;
        this._decks.update(decks =>
            decks.map(d => d.id === deckId ? { ...d, name: newName.trim() } : d)
        );
        this.saveDecks();
    }

    // --- Import/Export ---

    /**
     * Import cards and decks from a data object (used by global settings import)
     */
    importData(data: { cards?: Flashcard[]; decks?: Deck[] }): void {
        // Always set cards if the property exists (even if empty array)
        if (data.cards !== undefined) {
            this._cards.set(data.cards);
            this.saveCards();
        }
        // Always set decks if the property exists (even if empty array)
        if (data.decks !== undefined) {
            this._decks.set(data.decks);
            this.saveDecks();
        }
        this._currentIndex.set(0);
        this._activeDeckId.set(null);
    }

    /**
     * Export all cards and decks as a data object (used by global settings export)
     */
    exportData(): { cards: Flashcard[]; decks: Deck[] } {
        return {
            cards: this._cards(),
            decks: this._decks()
        };
    }

    /**
     * Reload data from localStorage (useful after external changes)
     */
    reloadFromStorage(): void {
        this._cards.set(this.loadCards());
        this._decks.set(this.loadDecks());
        this._currentIndex.set(0);
        this._activeDeckId.set(null);
    }

    importFromText(text: string, deckName?: string): { success: number; failed: number } {
        const lines = text.split('\n').filter(line => line.trim());
        let success = 0;
        let failed = 0;

        // Clear existing cards before import
        this._cards.set([]);

        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length >= 2) {
                const front = parts[0].trim();
                const back = parts.slice(1).join(';').trim();
                if (front && back) {
                    const card = createFlashcard(front, back);
                    this._cards.update(cards => [...cards, card]);
                    success++;
                } else {
                    failed++;
                }
            } else {
                failed++;
            }
        }

        this._currentIndex.set(0);
        this.saveCards();

        // Auto-save as deck if name provided
        if (deckName && success > 0) {
            this.saveDeck(deckName);
        }

        return { success, failed };
    }

    exportToText(deckId?: string): string {
        let cardsToExport = this._cards();

        if (deckId) {
            const deck = this._decks().find(d => d.id === deckId);
            if (deck) {
                cardsToExport = deck.cards;
            }
        }

        return cardsToExport
            .map(card => `${card.front};${card.back}`)
            .join('\n');
    }

    // --- Study Mode ---

    toggleRandomMode(): void {
        this._isRandomMode.update(v => !v);
        this._currentIndex.set(0);
    }

    toggleReversedMode(): void {
        this._isReversedMode.update(v => !v);
    }

    // --- Navigation ---

    goToNext(): void {
        const queue = this.studyQueue();
        if (queue.length === 0) return;
        this._currentIndex.update(i => (i + 1) % queue.length);
    }

    goToPrevious(): void {
        const queue = this.studyQueue();
        if (queue.length === 0) return;
        this._currentIndex.update(i => (i - 1 + queue.length) % queue.length);
    }

    resetPosition(): void {
        this._currentIndex.set(0);
    }

    // --- Persistence ---

    private loadCards(): Flashcard[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data) as Flashcard[];
        } catch {
            return [];
        }
    }

    private saveCards(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cards()));
        } catch (e) {
            console.error('Failed to save flashcards:', e);
        }
    }

    private loadDecks(): Deck[] {
        try {
            const data = localStorage.getItem(DECKS_STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data) as Deck[];
        } catch {
            return [];
        }
    }

    private saveDecks(): void {
        try {
            localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(this._decks()));
        } catch (e) {
            console.error('Failed to save decks:', e);
        }
    }

    // --- Utilities ---

    private shuffleArray<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
