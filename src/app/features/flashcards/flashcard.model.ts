/**
 * Flashcard data model with Leitner spaced repetition support
 */
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    createdAt: number;
    /** Leitner box (1-5), higher = longer review interval */
    box: number;
    /** Timestamp when card should be reviewed next */
    nextReview: number;
    /** Timestamp of last review */
    lastReviewed: number | null;
}

export type StudyMode = 'sequential' | 'random' | 'spaced';

/** Leitner box intervals in milliseconds */
export const LEITNER_INTERVALS: Record<number, number> = {
    1: 0,                           // Immediate
    2: 1 * 24 * 60 * 60 * 1000,    // 1 day
    3: 3 * 24 * 60 * 60 * 1000,    // 3 days
    4: 7 * 24 * 60 * 60 * 1000,    // 7 days
    5: 14 * 24 * 60 * 60 * 1000,   // 14 days
};

export function createFlashcard(front: string, back: string): Flashcard {
    return {
        id: crypto.randomUUID(),
        front: front.trim(),
        back: back.trim(),
        createdAt: Date.now(),
        box: 1,
        nextReview: Date.now(),
        lastReviewed: null,
    };
}
