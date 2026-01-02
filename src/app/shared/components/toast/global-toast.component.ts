import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../toast.service';

@Component({
    selector: 'app-global-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (toastService.isVisible()) {
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-down w-[90vw] max-w-lg">
            <div [class]="toastService.type() === 'success'
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 border-2 border-green-400/50'
                : 'bg-gradient-to-r from-red-600 to-rose-500 border-2 border-red-400/50'"
                class="p-4 sm:p-5 rounded-lg shadow-2xl flex items-center gap-3 sm:gap-4 w-full"
                [style.box-shadow]="toastService.type() === 'success'
                    ? '0 0 30px rgba(34, 197, 94, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)'
                    : '0 0 30px rgba(239, 68, 68, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)'">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <span class="material-symbols-sharp text-white text-2xl sm:text-3xl">
                        {{ toastService.type() === 'success' ? 'check_circle' : 'error' }}
                    </span>
                </div>
                <div class="flex-1 text-sm sm:text-base font-semibold text-white">{{ toastService.message() }}</div>
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
