import { Component, inject, signal, computed, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { ToastService } from '../../shared/toast.service';
import { FlashcardsService } from './flashcards.service';
import { Flashcard, Deck } from './flashcard.model';

// Components
import { DrawingCanvasComponent } from './components/drawing-canvas/drawing-canvas.component';
import { EditCardModalComponent } from './components/modals/edit-card-modal/edit-card-modal.component';
import { EditDeckModalComponent } from './components/modals/edit-deck-modal/edit-deck-modal.component';
import { NewCardModalComponent } from './components/modals/new-card-modal/new-card-modal.component';
import { NewDeckModalComponent } from './components/modals/new-deck-modal/new-deck-modal.component';
import { ImportModalComponent } from './components/modals/import-modal/import-modal.component';
import { SaveDeckModalComponent } from './components/modals/save-deck-modal/save-deck-modal.component';
import { SettingsModalComponent } from './components/modals/settings-modal/settings-modal.component';

@Component({
    selector: 'app-flashcards',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AppsLauncher,
        DrawingCanvasComponent,
        EditCardModalComponent,
        EditDeckModalComponent,
        NewCardModalComponent,
        NewDeckModalComponent,
        ImportModalComponent,
        SaveDeckModalComponent,
        SettingsModalComponent
    ],
    templateUrl: './flashcards.component.html'
})
export class FlashcardsComponent {
    protected flashcardsService = inject(FlashcardsService);
    private sidebarService = inject(SidebarService);
    private toastService = inject(ToastService);

    @ViewChild(DrawingCanvasComponent) drawingCanvas!: DrawingCanvasComponent;
    @ViewChild(ImportModalComponent) importModal!: ImportModalComponent;

    // UI State
    isFlipped = signal<boolean>(false);
    focusMode = signal<boolean>(false);

    // Search
    searchQuery = signal<string>('');

    // Filtered cards based on search query
    filteredCards = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const cards = this.flashcardsService.cards();
        if (!query) return cards;
        return cards.filter(card =>
            card.front.toLowerCase().includes(query) ||
            card.back.toLowerCase().includes(query)
        );
    });

    // Track duplicate card names (returns a Set of fronts that are duplicated)
    duplicateCardFronts = computed(() => {
        const cards = this.flashcardsService.cards();
        const frontCounts = new Map<string, number>();
        cards.forEach(card => {
            const front = card.front.toLowerCase().trim();
            frontCounts.set(front, (frontCounts.get(front) || 0) + 1);
        });
        const duplicates = new Set<string>();
        frontCounts.forEach((count, front) => {
            if (count > 1) duplicates.add(front);
        });
        return duplicates;
    });
    showDecksDropdown = signal<boolean>(false);

    // Modal visibility
    showSettingsModal = signal<boolean>(false);
    showImportModal = signal<boolean>(false);
    showSaveDeckModal = signal<boolean>(false);
    showEditCardModal = signal<boolean>(false);
    showNewDeckModal = signal<boolean>(false);
    showNewCardModal = signal<boolean>(false);
    showEditDeckModal = signal<boolean>(false);

    // Editing state
    editingCard = signal<Flashcard | null>(null);
    editingDeck = signal<Deck | null>(null);



    constructor() {
        effect(() => {
            const currentCard = this.flashcardsService.currentCard();
            if (currentCard) {
                setTimeout(() => this.scrollToCard(currentCard.id), 100);
            }
        });
    }

    // --- Keyboard Shortcuts ---
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (this.showSettingsModal() || this.showImportModal()) return;
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

    // --- Card Actions ---
    flipCard(): void {
        this.isFlipped.update(v => !v);
    }

    nextCard(): void {
        this.flashcardsService.goToNext();
        this.isFlipped.set(false);
        this.drawingCanvas?.clear();
    }

    prevCard(): void {
        this.flashcardsService.goToPrevious();
        this.isFlipped.set(false);
        this.drawingCanvas?.clear();
    }

    goToCard(cardId: string): void {
        this.flashcardsService.goToCard(cardId);
        this.isFlipped.set(false);
        this.drawingCanvas?.clear();
    }

    // --- Study Mode ---
    toggleRandomMode(): void {
        this.flashcardsService.toggleRandomMode();
        this.isFlipped.set(false);
        this.drawingCanvas?.clear();
    }

    toggleReversedMode(): void {
        this.flashcardsService.toggleReversedMode();
        this.isFlipped.set(false);
    }

    // --- UI Toggles ---
    toggleSettingsModal(): void {
        this.showSettingsModal.update(v => !v);
    }

    toggleRightSidebar(): void {
        this.sidebarService.toggleRight();
    }

    toggleFocusMode(): void {
        this.focusMode.update(v => !v);
        this.showDecksDropdown.set(false);
    }

    toggleDecksDropdown(): void {
        this.showDecksDropdown.update(v => !v);
    }

    closeDecksDropdown(): void {
        this.showDecksDropdown.set(false);
    }

    // --- Edit Card Modal ---
    openEditCardModal(card: Flashcard): void {
        this.editingCard.set(card);
        this.showEditCardModal.set(true);
    }

    closeEditCardModal(): void {
        this.showEditCardModal.set(false);
        this.editingCard.set(null);
    }

    saveCardEdit(data: { id: string; front: string; back: string }): void {
        this.flashcardsService.updateCard(data.id, data.front, data.back);
        this.toastService.show('Karte aktualisiert', 'success');
        this.closeEditCardModal();
    }

    deleteCard(id: string): void {
        if (confirm('Karte wirklich löschen?')) {
            this.flashcardsService.removeCard(id);
            this.toastService.show('Karte gelöscht', 'success');
        }
    }

    // --- Edit Deck Modal ---
    openEditDeckModal(deck: Deck): void {
        this.editingDeck.set(deck);
        this.showEditDeckModal.set(true);
    }

    closeEditDeckModal(): void {
        this.showEditDeckModal.set(false);
        this.editingDeck.set(null);
    }

    saveEditDeck(data: { id: string; name: string }): void {
        this.flashcardsService.renameDeck(data.id, data.name);
        this.toastService.show('Deck umbenannt', 'success');
        this.closeEditDeckModal();
    }

    // --- New Deck Modal ---
    openNewDeckModal(): void {
        this.showNewDeckModal.set(true);
    }

    closeNewDeckModal(): void {
        this.showNewDeckModal.set(false);
    }

    createDeck(name: string): void {
        const deck = this.flashcardsService.createEmptyDeck(name);
        if (deck) {
            this.toastService.show(`Deck "${name}" erstellt!`, 'success');
            this.closeNewDeckModal();
        }
    }

    // --- New Card Modal ---
    openNewCardModal(): void {
        this.showNewCardModal.set(true);
    }

    closeNewCardModal(): void {
        this.showNewCardModal.set(false);
    }

    createCard(data: { front: string; back: string }): void {
        this.flashcardsService.addCard(data.front, data.back);
        this.toastService.show('Karte erstellt!', 'success');
        this.closeNewCardModal();
    }

    // --- Import Modal ---
    openImportModal(): void {
        this.showImportModal.set(true);
        this.showSettingsModal.set(false);
    }

    closeImportModal(): void {
        this.showImportModal.set(false);
    }

    executeImport(data: { content: string; deckName: string }): void {
        const result = this.flashcardsService.importFromText(data.content, data.deckName || undefined);
        this.importModal?.setImportResult(result);
        this.toastService.show(`Deck "${data.deckName}" mit ${result.success} Karten importiert!`, 'success');
    }

    // --- Save Deck Modal ---
    openSaveDeckModal(): void {
        this.showSaveDeckModal.set(true);
    }

    closeSaveDeckModal(): void {
        this.showSaveDeckModal.set(false);
    }

    saveDeck(name: string): void {
        const deck = this.flashcardsService.saveDeck(name);
        if (deck) {
            this.toastService.show(`Deck "${name}" gespeichert!`, 'success');
            this.closeSaveDeckModal();
        }
    }

    // --- Deck Management ---
    loadDeck(deckId: string): void {
        this.flashcardsService.loadDeck(deckId);
        this.isFlipped.set(false);
        this.drawingCanvas?.clear();
        this.toastService.show('Deck geladen!', 'success');
    }

    deleteDeck(deckId: string): void {
        if (confirm('Deck wirklich löschen?')) {
            this.flashcardsService.deleteDeck(deckId);
            this.toastService.show('Deck gelöscht.', 'success');
        }
    }

    // --- Export ---
    exportCards(deckId: string): void {
        const text = this.flashcardsService.exportToText(deckId || undefined);
        if (!text) {
            this.toastService.show('Keine Karten zum Exportieren.', 'error');
            return;
        }

        let filename = 'flashcards';
        if (deckId) {
            const deck = this.flashcardsService.decks().find(d => d.id === deckId);
            if (deck) filename = deck.name;
        }

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.toastService.show('Export gestartet!', 'success');
    }

    // --- Clear ---
    clearAllCards(): void {
        if (confirm('Alle Karten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            this.flashcardsService.clearAllCards();
            this.toastService.show('Alle Karten gelöscht.', 'success');
        }
    }



    // --- Helpers ---
    private scrollToCard(cardId: string): void {
        // Only scroll on desktop (md breakpoint = 768px and above)
        // On mobile, just highlight the card without scrolling
        if (window.innerWidth < 768) return;

        const element = document.getElementById(`card-list-${cardId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
