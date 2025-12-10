import { Injectable, signal, computed } from '@angular/core';

export interface AudioNote {
    id: string;
    timestamp: Date;
    text: string;
}

@Injectable({
    providedIn: 'root'
})
export class AudioNotesService {
    private readonly STORAGE_KEY = 'audio_notes_entries';
    private notesSignal = signal<AudioNote[]>(this.loadNotes());

    // Public readonly signal for entries
    notes = this.notesSignal.asReadonly();

    // Computed count
    notesCount = computed(() => this.notesSignal().length);

    constructor() {
        // Notes are saved via saveNotes() calls in each mutation method
    }

    addNote(text: string): void {
        if (!text.trim()) return;

        const newNote: AudioNote = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            text: text.trim()
        };
        this.notesSignal.update(notes => [newNote, ...notes]);
        this.saveNotes(this.notesSignal());
    }

    updateNote(id: string, text: string): void {
        this.notesSignal.update(notes =>
            notes.map(n => n.id === id ? { ...n, text: text.trim() } : n)
        );
        this.saveNotes(this.notesSignal());
    }

    deleteNote(id: string): void {
        this.notesSignal.update(notes => notes.filter(n => n.id !== id));
        this.saveNotes(this.notesSignal());
    }

    deleteAllNotes(): void {
        this.notesSignal.set([]);
        this.saveNotes([]);
    }

    /**
     * Export all notes as TXT file
     * Format: - note text (one per line)
     */
    exportAsTxt(): Blob {
        const content = this.notesSignal()
            .map(note => `- ${note.text}`)
            .join('\n');
        return new Blob([content], { type: 'text/plain' });
    }

    /**
     * Get all notes formatted for Journal import
     * Returns concatenated text with each entry on new line prefixed with -
     */
    getNotesForJournalImport(): string {
        return this.notesSignal()
            .map(note => `- ${note.text}`)
            .join('\n');
    }

    private loadNotes(): AudioNote[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
            }
        } catch (e) {
            console.error('Failed to load audio notes', e);
        }
        return [];
    }

    private saveNotes(notes: AudioNote[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error('Failed to save audio notes', e);
        }
    }
}
