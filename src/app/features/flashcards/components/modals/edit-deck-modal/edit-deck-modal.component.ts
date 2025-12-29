import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Deck } from '../../../flashcard.model';

@Component({
    selector: 'app-edit-deck-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-deck-modal.component.html'
})
export class EditDeckModalComponent {
    deck = input.required<Deck>();

    closed = output<void>();
    saved = output<{ id: string; name: string }>();

    nameInput = signal('');

    ngOnInit(): void {
        this.nameInput.set(this.deck().name);
    }

    close(): void {
        this.closed.emit();
    }

    save(): void {
        const name = this.nameInput().trim();
        if (name) {
            this.saved.emit({ id: this.deck().id, name });
        }
    }
}
