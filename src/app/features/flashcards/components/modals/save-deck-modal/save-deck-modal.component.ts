import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-save-deck-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './save-deck-modal.component.html'
})
export class SaveDeckModalComponent {
    totalCards = input.required<number>();

    closed = output<void>();
    saved = output<string>();

    nameInput = signal('');

    close(): void {
        this.closed.emit();
    }

    save(): void {
        const name = this.nameInput().trim();
        if (name) {
            this.saved.emit(name);
        }
    }
}
