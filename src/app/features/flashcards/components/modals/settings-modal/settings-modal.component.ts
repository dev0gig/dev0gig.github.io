import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Deck } from '../../../flashcard.model';

@Component({
    selector: 'app-settings-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings-modal.component.html'
})
export class SettingsModalComponent {
    decks = input.required<Deck[]>();

    closed = output<void>();
    openImport = output<void>();
    exportCards = output<string>();
    clearAll = output<void>();

    exportDeckId = signal('');

    close(): void {
        this.closed.emit();
    }

    onOpenImport(): void {
        this.openImport.emit();
    }

    onExport(): void {
        this.exportCards.emit(this.exportDeckId());
    }

    onClearAll(): void {
        this.clearAll.emit();
    }
}
