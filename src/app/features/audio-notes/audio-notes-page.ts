import { Component, signal, inject, effect, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
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
    onstart: (() => void) | null;
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
export class AudioNotesPage implements OnDestroy, AfterViewInit {
    audioNotes = inject(AudioNotesService);
    journal = inject(JournalService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    router = inject(Router);

    // UI State
    showSettingsModal = signal(false);
    editMode = signal(false);
    isRecording = signal(false);
    isListening = signal(false); // New: listening for voice before recording
    recordingText = signal('');
    interimText = signal(''); // Live preview of currently spoken text
    inputText = signal('');
    editingNoteId = signal<string | null>(null);
    editingNoteText = signal('');
    importStatus = signal<{ success: boolean; message: string } | null>(null);
    recordingStatus = signal<string>(''); // Status text for user feedback

    @ViewChild('noteInput') noteInput!: ElementRef<HTMLTextAreaElement>;

    // Speech recognition
    private recognition: SpeechRecognition | null = null;
    speechSupported = signal(false);

    // Voice Activity Detection (VAD)
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private mediaStream: MediaStream | null = null;
    private vadCheckInterval: number | null = null;
    private silenceTimeout: number | null = null;
    private readonly SILENCE_THRESHOLD = 15; // Volume threshold (0-255)
    private readonly SILENCE_DURATION = 1000; // 1 second of silence to stop
    private hasDetectedVoice = false;
    private recognitionStarted = false;

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

    ngOnDestroy(): void {
        this.stopAllRecording();
    }

    ngAfterViewInit() {
        // Auto-focus input to trigger keyboard on mobile
        setTimeout(() => {
            if (this.noteInput?.nativeElement) {
                this.noteInput.nativeElement.focus();
            }
        }, 500);
    }

    private initSpeechRecognition(): void {
        const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition;
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false; // Changed: no continuous mode
        this.recognition.interimResults = true;
        this.recognition.lang = 'de-DE';

        this.recognition.onstart = () => {
            this.recognitionStarted = true;
        };

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
                this.interimText.set(''); // Clear interim when we get final
            }

            // Update interim text for live preview
            this.interimText.set(interimTranscript);

            // Reset silence timer when we get results
            if (finalTranscript || interimTranscript) {
                this.resetSilenceTimer();
            }
        };

        this.recognition.onerror = (event: Event) => {
            console.error('Speech recognition error', event);
            // Don't stop on no-speech error, just continue listening
            const errorEvent = event as any;
            if (errorEvent.error !== 'no-speech') {
                this.stopAllRecording();
            }
        };

        this.recognition.onend = () => {
            this.recognitionStarted = false;
            // If we were recording, finish the recording
            if (this.hasDetectedVoice) {
                this.finishRecording();
            }
        };
    }

    private async startVAD(): Promise<void> {
        try {
            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create audio context and analyser
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Resume AudioContext - wichtig für Android, wo der Context im suspended State startet
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            // Start monitoring audio levels
            this.hasDetectedVoice = false;
            this.isListening.set(true);
            this.recordingStatus.set('Höre zu...');

            this.vadCheckInterval = window.setInterval(() => this.checkVoiceActivity(), 100);
        } catch (error) {
            console.error('Failed to start VAD:', error);
            this.recordingStatus.set('Mikrofon-Fehler');
            this.stopAllRecording();
        }
    }

    private checkVoiceActivity(): void {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

        if (average > this.SILENCE_THRESHOLD) {
            // Voice detected
            if (!this.hasDetectedVoice) {
                this.hasDetectedVoice = true;
                this.isRecording.set(true);
                this.recordingStatus.set('Aufnahme läuft...');

                // Start speech recognition if not already running
                if (this.recognition && !this.recognitionStarted) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        // Already started, ignore
                    }
                }
            }
            // Note: Don't reset silence timer here - only speech recognition results should control that
            // This prevents background noise from keeping the recording alive
        }
    }

    private resetSilenceTimer(): void {
        // Clear existing timer
        if (this.silenceTimeout !== null) {
            window.clearTimeout(this.silenceTimeout);
        }

        // Set new timer - stop after SILENCE_DURATION of silence
        if (this.hasDetectedVoice) {
            this.silenceTimeout = window.setTimeout(() => {
                this.finishRecording();
            }, this.SILENCE_DURATION);
        }
    }

    private finishRecording(): void {
        // Stop recognition
        if (this.recognition && this.recognitionStarted) {
            this.recognition.stop();
        }

        const text = this.recordingText();
        let statusMessage = '';

        if (text.trim()) {
            this.audioNotes.addNote(text);
            statusMessage = 'Notiz gespeichert!';
        } else {
            statusMessage = 'Keine Sprache erkannt';
        }

        // Clear the text before stopping to prevent double-save in stopAllRecording
        this.recordingText.set('');

        // Stop everything completely - no automatic restart
        this.stopAllRecording();

        // Restore status message after stopAllRecording clears it
        this.recordingStatus.set(statusMessage);

        // Clear status message after delay
        setTimeout(() => {
            if (!this.isListening() && !this.isRecording()) {
                this.recordingStatus.set('');
            }
        }, 2000);
    }

    private stopAllRecording(): void {
        // Stop VAD interval
        if (this.vadCheckInterval !== null) {
            window.clearInterval(this.vadCheckInterval);
            this.vadCheckInterval = null;
        }

        // Clear silence timeout
        if (this.silenceTimeout !== null) {
            window.clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }

        // Stop speech recognition
        if (this.recognition && this.recognitionStarted) {
            this.recognition.stop();
        }

        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.analyser = null;
        }

        // Reset state
        this.isListening.set(false);
        this.isRecording.set(false);
        this.hasDetectedVoice = false;
        this.recordingStatus.set('');

        // Save any pending text
        const text = this.recordingText();
        if (text.trim()) {
            this.audioNotes.addNote(text);
        }
        this.recordingText.set('');
        this.interimText.set('');
    }

    toggleRecording(): void {
        if (!this.recognition) return;

        if (this.isListening() || this.isRecording()) {
            // Stop everything
            this.stopAllRecording();
        } else {
            // Start VAD listening
            this.startVAD();
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
