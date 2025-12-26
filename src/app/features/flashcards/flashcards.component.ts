import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { FlashcardsService } from './flashcards.service';
import { StudyMode } from './flashcard.model';

@Component({
    selector: 'app-flashcards',
    standalone: true,
    imports: [CommonModule, FormsModule, AppsLauncher],
    templateUrl: './flashcards.component.html'
})
export class FlashcardsComponent implements AfterViewInit, OnDestroy {
    protected flashcardsService = inject(FlashcardsService);
    private sidebarService = inject(SidebarService);

    @ViewChild('drawingCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D | null = null;
    private isDrawing = false;
    private lastX = 0;
    private lastY = 0;

    // UI State
    isFlipped = signal<boolean>(false);
    showSettingsModal = signal<boolean>(false);
    showImportModal = signal<boolean>(false);
    importText = signal<string>('');
    lastImportResult = signal<{ success: number; failed: number } | null>(null);
    toastMessage = signal<string>('');
    toastType = signal<'success' | 'error'>('success');

    // Touch event handlers bound to instance
    private boundTouchStart = this.handleTouchStart.bind(this);
    private boundTouchMove = this.handleTouchMove.bind(this);
    private boundTouchEnd = this.handleTouchEnd.bind(this);

    // --- Keyboard Shortcuts ---
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        // Don't trigger if modals are open
        if (this.showSettingsModal() || this.showImportModal()) return;

        // No card to interact with
        if (!this.flashcardsService.currentCard()) return;

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.flipCard();
                break;
            case 'KeyY':
                if (this.isFlipped()) {
                    event.preventDefault();
                    this.markKnown();
                }
                break;
            case 'KeyN':
                if (this.isFlipped()) {
                    event.preventDefault();
                    this.markUnknown();
                }
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.prevCard();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextCard();
                break;
        }
    }

    ngAfterViewInit(): void {
        this.initCanvas();
    }

    ngOnDestroy(): void {
        this.removeCanvasListeners();
    }


    // --- Canvas Setup ---

    private initCanvas(): void {
        if (!this.canvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d');

        if (this.ctx) {
            this.ctx.strokeStyle = '#e4e4e7';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }

        // Add touch event listeners with passive: false for preventDefault
        canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }

    private removeCanvasListeners(): void {
        if (!this.canvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        canvas.removeEventListener('touchstart', this.boundTouchStart);
        canvas.removeEventListener('touchmove', this.boundTouchMove);
        canvas.removeEventListener('touchend', this.boundTouchEnd);
    }

    // --- Mouse Events ---

    onMouseDown(event: MouseEvent): void {
        this.isDrawing = true;
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.lastX = (event.clientX - rect.left) * scaleX;
        this.lastY = (event.clientY - rect.top) * scaleY;
    }

    onMouseMove(event: MouseEvent): void {
        if (!this.isDrawing || !this.ctx) return;
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    onMouseUp(): void {
        this.isDrawing = false;
    }

    onMouseLeave(): void {
        this.isDrawing = false;
    }

    // --- Touch Events ---

    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length !== 1) return;

        this.isDrawing = true;
        const touch = event.touches[0];
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.lastX = (touch.clientX - rect.left) * scaleX;
        this.lastY = (touch.clientY - rect.top) * scaleY;
    }

    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (!this.isDrawing || !this.ctx || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        this.isDrawing = false;

    }

    // --- Canvas Actions ---

    clearCanvas(): void {
        if (!this.ctx || !this.canvasRef?.nativeElement) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // --- Card Actions ---

    flipCard(): void {
        this.isFlipped.update(v => !v);
    }

    nextCard(): void {
        this.flashcardsService.goToNext();
        this.isFlipped.set(false);
        this.clearCanvas();
    }

    prevCard(): void {
        this.flashcardsService.goToPrevious();
        this.isFlipped.set(false);
        this.clearCanvas();
    }

    markKnown(): void {
        const card = this.flashcardsService.currentCard();
        if (card) {
            this.flashcardsService.markKnown(card);
            this.isFlipped.set(false);
            this.clearCanvas();
            this.showToast('Karte als bekannt markiert!', 'success');
        }
    }

    markUnknown(): void {
        const card = this.flashcardsService.currentCard();
        if (card) {
            this.flashcardsService.markUnknown(card);
            this.isFlipped.set(false);
            this.clearCanvas();
            this.showToast('Karte wird wiederholt.', 'error');
        }
    }

    // --- Study Mode ---

    setStudyMode(mode: StudyMode): void {
        this.flashcardsService.setStudyMode(mode);
        this.isFlipped.set(false);
        this.clearCanvas();
    }

    // --- Modals ---

    toggleSettingsModal(): void {
        this.showSettingsModal.update(v => !v);
    }

    toggleRightSidebar(): void {
        this.sidebarService.toggleRight();
    }

    openImportModal(): void {
        this.importText.set('');
        this.lastImportResult.set(null);
        this.showImportModal.set(true);
        this.showSettingsModal.set(false);
    }

    closeImportModal(): void {
        this.showImportModal.set(false);
    }

    // --- Import/Export ---

    executeImport(): void {
        const text = this.importText().trim();
        if (!text) return;

        const result = this.flashcardsService.importFromText(text);
        this.lastImportResult.set(result);
        this.showToast(`Import: ${result.success} Karten hinzugefügt`, 'success');
    }

    exportCards(): void {
        const text = this.flashcardsService.exportToText();
        if (!text) {
            this.showToast('Keine Karten zum Exportieren.', 'error');
            return;
        }

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flashcards.txt';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Export gestartet!', 'success');
    }

    async copyExport(): Promise<void> {
        try {
            const text = this.flashcardsService.exportToText();
            await navigator.clipboard.writeText(text);
            this.showToast('In Zwischenablage kopiert!', 'success');
        } catch {
            this.showToast('Kopieren fehlgeschlagen.', 'error');
        }
    }

    // --- Clear ---

    clearAllCards(): void {
        if (confirm('Alle Karten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            this.flashcardsService.clearAllCards();
            this.showToast('Alle Karten gelöscht.', 'success');
        }
    }

    // --- Toast ---

    private showToast(message: string, type: 'success' | 'error'): void {
        this.toastMessage.set(message);
        this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 3000);
    }

    hideToast(): void {
        this.toastMessage.set('');
    }
}
