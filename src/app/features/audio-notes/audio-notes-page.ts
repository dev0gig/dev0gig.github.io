import { Component, signal, inject, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AudioNotesService, AudioNote } from './audio-notes';
import { JournalService } from '../journal/journal';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { SettingsService } from '../../shared/settings.service';

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
        SpeechRecognition: new () => SpeechRecognition;
    }
}

@Component({
    selector: 'app-audio-notes-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, AppsLauncher],
    templateUrl: './audio-notes-page.html',
    styleUrl: './audio-notes-page.css'
})
export class AudioNotesPage {
    audioNotes = inject(AudioNotesService);
    journal = inject(JournalService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    router = inject(Router);

    // UI State
    showSettingsModal = signal(false);
    editMode = signal(false);
    isRecording = signal(false);
    recordingText = signal('');
    inputText = signal('');
    editingNoteId = signal<string | null>(null);
    editingNoteText = signal('');
    importStatus = signal<{ success: boolean; message: string } | null>(null);

    // Speech recognition
    private recognition: SpeechRecognition | null = null;
    speechSupported = signal(false);

    constructor() {
        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.speechSupported.set(true);
            this.initSpeechRecognition();
        }

        // Close settings modal on route change
        this.router.events.subscribe(() => {
            if (this.showSettingsModal()) {
                this.showSettingsModal.set(false);
            }
        });

        // Listen to settings service trigger
        let previousTrigger = this.settingsService.trigger();
        effect(() => {
            const trigger = this.settingsService.trigger();
            if (trigger > previousTrigger) {
                this.showSettingsModal.set(true);
                previousTrigger = trigger;
            }
        });
    }

    private initSpeechRecognition(): void {
        const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition;
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'de-DE';

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript = transcript;
                }
            }

            if (finalTranscript) {
                this.recordingText.update(t => t + finalTranscript);
            }
            // Show interim results for feedback
            if (interimTranscript) {
                // Could show interim in UI
            }
        };

        this.recognition.onerror = (event: Event) => {
            console.error('Speech recognition error', event);
            this.isRecording.set(false);
        };

        this.recognition.onend = () => {
            if (this.isRecording()) {
                // Auto-restart if still recording
                this.recognition?.start();
            }
        };
    }

    toggleRecording(): void {
        if (!this.recognition) return;

        if (this.isRecording()) {
            this.isRecording.set(false);
            this.recognition.stop();

            // Save the recorded text as a new note
            const text = this.recordingText();
            if (text.trim()) {
                this.audioNotes.addNote(text);
            }
            this.recordingText.set('');
        } else {
            this.isRecording.set(true);
            this.recordingText.set('');
            this.recognition.start();
        }
    }

    submitTextNote(): void {
        const text = this.inputText();
        if (text.trim()) {
            this.audioNotes.addNote(text);
            this.inputText.set('');
        }
    }

    onInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.submitTextNote();
        }
    }

    toggleSettingsModal(): void {
        this.showSettingsModal.update(v => !v);
    }

    toggleRightSidebar(): void {
        this.sidebarService.toggleRight();
    }

    toggleEditMode(): void {
        this.editMode.update(v => !v);
        if (!this.editMode()) {
            this.editingNoteId.set(null);
        }
    }

    startEditing(note: AudioNote): void {
        this.editingNoteId.set(note.id);
        this.editingNoteText.set(note.text);
    }

    saveEdit(): void {
        const id = this.editingNoteId();
        if (id) {
            this.audioNotes.updateNote(id, this.editingNoteText());
            this.editingNoteId.set(null);
            this.editingNoteText.set('');
        }
    }

    cancelEdit(): void {
        this.editingNoteId.set(null);
        this.editingNoteText.set('');
    }

    deleteNote(id: string): void {
        if (confirm('Diese Notiz wirklich löschen?')) {
            this.audioNotes.deleteNote(id);
        }
    }

    onExportTxt(): void {
        const blob = this.audioNotes.exportAsTxt();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio_notes_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    onImportToJournal(): void {
        const notesText = this.audioNotes.getNotesForJournalImport();
        if (!notesText.trim()) {
            this.importStatus.set({
                success: false,
                message: 'Keine Notizen zum Importieren vorhanden'
            });
            return;
        }

        const today = new Date();
        const existingEntries = this.journal.getEntriesByDate(today);

        if (existingEntries.length > 0) {
            // Append to existing entry
            const existingEntry = existingEntries[0];
            const newText = existingEntry.text + '\n\n' + notesText;
            this.journal.updateEntry(existingEntry.id, newText);
            this.importStatus.set({
                success: true,
                message: 'Notizen zu bestehendem Journal-Eintrag hinzugefügt'
            });
        } else {
            // Create new entry
            this.journal.addEntryWithDate(notesText, today);
            this.importStatus.set({
                success: true,
                message: 'Neuer Journal-Eintrag für heute erstellt'
            });
        }

        // Clear status after 3 seconds
        setTimeout(() => {
            this.importStatus.set(null);
        }, 3000);
    }

    onDeleteAll(): void {
        if (confirm('Alle AudioNotes wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            this.audioNotes.deleteAllNotes();
            this.toggleSettingsModal();
        }
    }

    formatTimestamp(date: Date): string {
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
