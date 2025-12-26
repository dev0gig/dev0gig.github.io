/**
 * Simple Flashcard data model
 */
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    createdAt: number;
}

/**
 * A deck is a saved collection of flashcards
 */
export interface Deck {
    id: string;
    name: string;
    cards: Flashcard[];
    createdAt: number;
}

export function createFlashcard(front: string, back: string): Flashcard {
    return {
        id: crypto.randomUUID(),
        front: front.trim(),
        back: back.trim(),
        createdAt: Date.now(),
    };
}

export function createDeck(name: string, cards: Flashcard[]): Deck {
    return {
        id: crypto.randomUUID(),
        name: name.trim(),
        cards: [...cards],
        createdAt: Date.now(),
    };
}
