import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../toast.service';

@Component({
    selector: 'app-global-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (toastService.isVisible()) {
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-down w-auto max-w-sm">
            <div [class]="toastService.type() === 'success'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                : 'bg-gradient-to-r from-rose-600 to-pink-600'"
                class="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-white">
                
                <span class="material-symbols-sharp text-xl">
                    {{ toastService.type() === 'success' ? 'check_circle' : 'error' }}
                </span>
                
                <div class="text-sm font-medium">{{ toastService.message() }}</div>
            </div>
        </div>
        }
    `,
    styles: [`
        @keyframes slide-in-down {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        .animate-slide-in-down {
            animation: slide-in-down 0.3s ease-out;
        }
    `]
})
export class GlobalToastComponent {
    protected toastService = inject(ToastService);
}
