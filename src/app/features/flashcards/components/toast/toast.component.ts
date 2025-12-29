import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast.component.html'
})
export class ToastComponent {
    message = input.required<string>();
    type = input<'success' | 'error'>('success');

    closed = output<void>();

    close(): void {
        this.closed.emit();
    }
}
