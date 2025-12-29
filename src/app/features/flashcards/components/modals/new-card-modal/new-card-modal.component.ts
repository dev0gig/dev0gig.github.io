import { Component, ElementRef, ViewChild, AfterViewInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-new-card-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './new-card-modal.component.html'
})
export class NewCardModalComponent implements AfterViewInit {
    @ViewChild('frontInputEl') frontInputRef!: ElementRef<HTMLTextAreaElement>;

    closed = output<void>();
    created = output<{ front: string; back: string }>();

    front = signal('');
    back = signal('');

    ngAfterViewInit(): void {
        setTimeout(() => this.frontInputRef?.nativeElement?.focus(), 50);
    }

    close(): void {
        this.closed.emit();
    }

    create(): void {
        const frontVal = this.front().trim();
        const backVal = this.back().trim();

        if (frontVal && backVal) {
            this.created.emit({ front: frontVal, back: backVal });
        }
    }
}
