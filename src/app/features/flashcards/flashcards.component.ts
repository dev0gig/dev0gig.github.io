import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { FlashcardsService } from './flashcards.service';

@Component({
    selector: 'app-flashcards',
    standalone: true,
    imports: [CommonModule, FormsModule, AppsLauncher],
    templateUrl: './flashcards.component.html'
})
export class FlashcardsComponent implements AfterViewInit, OnDestroy {
    protected flashcardsService = inject(FlashcardsService);

    constructor() {
        effect(() => {
            const currentCard = this.flashcardsService.currentCard();
            if (currentCard) {
                // Wait for DOM update
                setTimeout(() => this.scrollToCard(currentCard.id), 100);
            }
        });
    }

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
    showSaveDeckModal = signal<boolean>(false);
    showEditModal = signal<boolean>(false);
    importText = signal<string>('');
    deckNameInput = signal<string>('');
    saveDeckName = signal<string>('');
    selectedFileName = signal<string>('');
    selectedFileContent = signal<string>('');
    editFrontInput = signal<string>('');
    editBackInput = signal<string>('');
    editingCardId = signal<string | null>(null);
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

    // --- Study Mode ---

    toggleRandomMode(): void {
        this.flashcardsService.toggleRandomMode();
        this.isFlipped.set(false);
        this.clearCanvas();
    }

    toggleReversedMode(): void {
        this.flashcardsService.toggleReversedMode();
        this.isFlipped.set(false);
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
        this.deckNameInput.set('');
        this.lastImportResult.set(null);
        this.showImportModal.set(true);
        this.showSettingsModal.set(false);
    }

    closeImportModal(): void {
        this.showImportModal.set(false);
    }

    openSaveDeckModal(): void {
        this.saveDeckName.set('');
        this.showSaveDeckModal.set(true);
    }

    closeSaveDeckModal(): void {
        this.showSaveDeckModal.set(false);
    }

    openEditCardModal(card: any): void {
        this.editingCardId.set(card.id);
        this.editFrontInput.set(card.front);
        this.editBackInput.set(card.back);
        this.showEditModal.set(true);
    }

    closeEditModal(): void {
        this.showEditModal.set(false);
        this.editingCardId.set(null);
    }

    saveCardEdit(): void {
        const id = this.editingCardId();
        const front = this.editFrontInput().trim();
        const back = this.editBackInput().trim();

        if (id && front && back) {
            this.flashcardsService.updateCard(id, front, back);
            this.showToast('Karte aktualisiert', 'success');
            this.closeEditModal();
        }
    }

    deleteCard(id: string): void {
        if (confirm('Karte wirklich löschen?')) {
            this.flashcardsService.removeCard(id);
            this.showToast('Karte gelöscht', 'success');
        }
    }

    // --- Deck Management ---

    loadDeck(deckId: string): void {
        this.flashcardsService.loadDeck(deckId);
        this.isFlipped.set(false);
        this.clearCanvas();
        this.showToast('Deck geladen!', 'success');
    }

    deleteDeck(deckId: string): void {
        if (confirm('Deck wirklich löschen?')) {
            this.flashcardsService.deleteDeck(deckId);
            this.showToast('Deck gelöscht.', 'success');
        }
    }

    executeSaveDeck(): void {
        const name = this.saveDeckName().trim();
        if (!name) return;

        const deck = this.flashcardsService.saveDeck(name);
        if (deck) {
            this.showToast(`Deck "${name}" gespeichert!`, 'success');
            this.closeSaveDeckModal();
        }
    }

    // --- Import/Export ---

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        // Extract filename without extension as deck name
        const fileName = file.name.replace(/\.txt$/i, '');

        const reader = new FileReader();
        reader.onload = () => {
            this.selectedFileName.set(fileName);
            this.selectedFileContent.set(reader.result as string);
        };
        reader.readAsText(file);
    }

    clearSelectedFile(): void {
        this.selectedFileName.set('');
        this.selectedFileContent.set('');
    }

    executeFileImport(): void {
        const content = this.selectedFileContent().trim();
        const deckName = this.selectedFileName().trim();
        if (!content) return;

        const result = this.flashcardsService.importFromText(content, deckName || undefined);
        this.lastImportResult.set(result);
        this.showToast(`Deck "${deckName}" mit ${result.success} Karten importiert!`, 'success');
    }

    executeImport(): void {
        const text = this.importText().trim();
        if (!text) return;

        const deckName = this.deckNameInput().trim() || undefined;
        const result = this.flashcardsService.importFromText(text, deckName);
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

    private scrollToCard(cardId: string): void {
        const element = document.getElementById(`card-list-${cardId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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
