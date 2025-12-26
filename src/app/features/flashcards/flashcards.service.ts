import { Injectable, signal, computed } from '@angular/core';
import { Flashcard, StudyMode, LEITNER_INTERVALS, createFlashcard } from './flashcard.model';

const STORAGE_KEY = 'flashcards_data';

@Injectable({ providedIn: 'root' })
export class FlashcardsService {
    private _cards = signal<Flashcard[]>(this.loadCards());
    private _studyMode = signal<StudyMode>('sequential');
    private _currentIndex = signal<number>(0);

    // Public readonly signals
    readonly cards = this._cards.asReadonly();
    readonly studyMode = this._studyMode.asReadonly();
    readonly currentIndex = this._currentIndex.asReadonly();

    /** Cards ordered by current study mode */
    readonly studyQueue = computed(() => {
        const cards = [...this._cards()];
        const mode = this._studyMode();

        switch (mode) {
            case 'sequential':
                return cards;
            case 'random':
                return this.shuffleArray(cards);
            case 'spaced':
                // Sort by nextReview (due first), then by box (lower first)
                return cards.sort((a, b) => {
                    const now = Date.now();
                    const aDue = a.nextReview <= now;
                    const bDue = b.nextReview <= now;
                    if (aDue !== bDue) return aDue ? -1 : 1;
                    if (a.nextReview !== b.nextReview) return a.nextReview - b.nextReview;
                    return a.box - b.box;
                });
            default:
                return cards;
        }
    });

    readonly currentCard = computed(() => {
        const queue = this.studyQueue();
        const index = this._currentIndex();
        return queue[index] ?? null;
    });

    readonly totalCards = computed(() => this._cards().length);

    readonly dueCards = computed(() => {
        const now = Date.now();
        return this._cards().filter(c => c.nextReview <= now).length;
    });

    // --- Card Management ---

    addCard(front: string, back: string): void {
        if (!front.trim() || !back.trim()) return;
        const card = createFlashcard(front, back);
        this._cards.update(cards => [...cards, card]);
        this.saveCards();
    }

    removeCard(id: string): void {
        this._cards.update(cards => cards.filter(c => c.id !== id));
        this.saveCards();
        // Adjust index if needed
        if (this._currentIndex() >= this._cards().length) {
            this._currentIndex.set(Math.max(0, this._cards().length - 1));
        }
    }

    clearAllCards(): void {
        this._cards.set([]);
        this._currentIndex.set(0);
        this.saveCards();
    }

    // --- Import/Export ---

    importFromText(text: string): { success: number; failed: number } {
        const lines = text.split('\n').filter(line => line.trim());
        let success = 0;
        let failed = 0;

        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length >= 2) {
                const front = parts[0].trim();
                const back = parts.slice(1).join(';').trim(); // Handle semicolons in back text
                if (front && back) {
                    this.addCard(front, back);
                    success++;
                } else {
                    failed++;
                }
            } else {
                failed++;
            }
        }

        return { success, failed };
    }

    exportToText(): string {
        return this._cards()
            .map(card => `${card.front};${card.back}`)
            .join('\n');
    }

    // --- Study Mode ---

    setStudyMode(mode: StudyMode): void {
        this._studyMode.set(mode);
        this._currentIndex.set(0);
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

    // --- Spaced Repetition (Leitner) ---

    markKnown(card: Flashcard): void {
        this._cards.update(cards =>
            cards.map(c => {
                if (c.id !== card.id) return c;
                const newBox = Math.min(c.box + 1, 5);
                const interval = LEITNER_INTERVALS[newBox] || 0;
                return {
                    ...c,
                    box: newBox,
                    lastReviewed: Date.now(),
                    nextReview: Date.now() + interval,
                };
            })
        );
        this.saveCards();
        this.goToNext();
    }

    markUnknown(card: Flashcard): void {
        this._cards.update(cards =>
            cards.map(c => {
                if (c.id !== card.id) return c;
                return {
                    ...c,
                    box: 1,
                    lastReviewed: Date.now(),
                    nextReview: Date.now(), // Immediate review
                };
            })
        );
        this.saveCards();
        this.goToNext();
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
