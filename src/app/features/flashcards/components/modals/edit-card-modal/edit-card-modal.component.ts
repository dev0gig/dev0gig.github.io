import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Flashcard } from '../../../flashcard.model';

@Component({
    selector: 'app-edit-card-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-card-modal.component.html'
})
export class EditCardModalComponent {
    card = input.required<Flashcard>();

    closed = output<void>();
    saved = output<{ id: string; front: string; back: string }>();

    frontInput = signal('');
    backInput = signal('');

    ngOnInit(): void {
        const c = this.card();
        this.frontInput.set(c.front);
        this.backInput.set(c.back);
    }

    close(): void {
        this.closed.emit();
    }

    save(): void {
        const front = this.frontInput().trim();
        const back = this.backInput().trim();

        if (front && back) {
            this.saved.emit({ id: this.card().id, front, back });
        }
    }
}
