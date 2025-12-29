import { Component, ElementRef, ViewChild, AfterViewInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-new-deck-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './new-deck-modal.component.html'
})
export class NewDeckModalComponent implements AfterViewInit {
    @ViewChild('nameInputEl') nameInputRef!: ElementRef<HTMLInputElement>;

    closed = output<void>();
    created = output<string>();

    name = signal('');

    ngAfterViewInit(): void {
        setTimeout(() => this.nameInputRef?.nativeElement?.focus(), 50);
    }

    close(): void {
        this.closed.emit();
    }

    create(): void {
        const nameVal = this.name().trim();
        if (nameVal) {
            this.created.emit(nameVal);
        }
    }
}
