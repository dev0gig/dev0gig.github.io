import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioNotesService } from '../../features/audio-notes/audio-notes';

@Component({
    selector: 'app-quick-note',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quick-note.html',
    styleUrl: './quick-note.css'
})
export class QuickNoteComponent {
    private audioNotes = inject(AudioNotesService);

    @ViewChild('noteInput') noteInput!: ElementRef<HTMLTextAreaElement>;

    isVisible = signal(false);
    noteText = signal('');

    // Position for dragging
    position = signal({ x: 0, y: 0 });

    // Drag state
    private isDragging = false;
    private dragOffset = { x: 0, y: 0 };

    toggle(): void {
        if (this.isVisible()) {
            this.close();
        } else {
            this.open();
        }
    }

    open(): void {
        // Center the modal in viewport
        this.centerModal();
        this.isVisible.set(true);

        // Focus textarea after view updates
        setTimeout(() => {
            this.noteInput?.nativeElement?.focus();
        }, 0);
    }

    close(): void {
        this.isVisible.set(false);
        this.noteText.set('');
    }

    private centerModal(): void {
        const modalWidth = 320;
        const modalHeight = 200;
        const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
        const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
        this.position.set({ x, y });
    }

    onEnter(event: KeyboardEvent): void {
        // Prevent newline
        event.preventDefault();

        const text = this.noteText().trim();
        if (text) {
            // Add prefix and save to AudioNotes
            this.audioNotes.addNote(`Schnellnotiz: ${text}`);
            this.close();
        }
    }

    // Drag functionality
    startDrag(event: MouseEvent | TouchEvent): void {
        this.isDragging = true;
        const pos = this.position();

        if (event instanceof MouseEvent) {
            this.dragOffset = {
                x: event.clientX - pos.x,
                y: event.clientY - pos.y
            };
        } else {
            const touch = event.touches[0];
            this.dragOffset = {
                x: touch.clientX - pos.x,
                y: touch.clientY - pos.y
            };
        }

        event.preventDefault();
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    onDrag(event: MouseEvent | TouchEvent): void {
        if (!this.isDragging) return;

        let clientX: number, clientY: number;

        if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            const touch = event.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        }

        const newX = Math.max(0, Math.min(clientX - this.dragOffset.x, window.innerWidth - 320));
        const newY = Math.max(0, Math.min(clientY - this.dragOffset.y, window.innerHeight - 200));

        this.position.set({ x: newX, y: newY });
    }

    @HostListener('document:mouseup')
    @HostListener('document:touchend')
    onDragEnd(): void {
        this.isDragging = false;
    }
}
