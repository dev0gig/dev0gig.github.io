import { Injectable, signal, computed } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private messageSignal = signal<string>('');
    private typeSignal = signal<'success' | 'error'>('success');
    private timeout: ReturnType<typeof setTimeout> | null = null;

    readonly message = this.messageSignal.asReadonly();
    readonly type = this.typeSignal.asReadonly();
    readonly isVisible = computed(() => this.messageSignal() !== '');

    show(message: string, type: 'success' | 'error' = 'success'): void {
        // Clear any existing timeout to prevent overlapping
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.messageSignal.set(message);
        this.typeSignal.set(type);

        // Auto-dismiss after 3 seconds
        this.timeout = setTimeout(() => {
            this.messageSignal.set('');
            this.timeout = null;
        }, 3000);
    }
}
