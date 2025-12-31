import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MtgInventoryService } from '../../mtg-inventory.service';
import { MtgCardBasic } from '../../mtg-card.model';

@Component({
    selector: 'app-mtg-card-detail-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mtg-card-detail-modal.component.html'
})
export class MtgCardDetailModalComponent {
    private inventoryService = inject(MtgInventoryService);

    // Inputs
    card = input.required<MtgCardBasic>();
    index = input.required<number>();

    // Outputs
    close = output<void>();
    toast = output<{ message: string; type: 'success' | 'error' }>();

    // Local State
    isRefreshingPrices = signal<boolean>(false);

    // Helper Methods
    closeModal() {
        this.close.emit();
    }

    getDetails(card: MtgCardBasic) {
        return this.inventoryService.getDetails(card.set, card.collectorNumber);
    }

    isLoading(card: MtgCardBasic): boolean {
        return this.inventoryService.isLoading(card.set, card.collectorNumber);
    }

    getCardCount(card: MtgCardBasic): number {
        return this.inventoryService.getCardCount(card.set, card.collectorNumber);
    }

    updateQuantity(card: MtgCardBasic, delta: number): void {
        const currentCount = this.getCardCount(card);
        if (currentCount + delta <= 0) {
            // Would remove all - close modal and remove
            this.inventoryService.updateCardQuantity(card.set, card.collectorNumber, -currentCount);
            this.closeModal();
            this.toast.emit({ message: 'Karte aus Sammlung entfernt.', type: 'success' });
        } else {
            this.inventoryService.updateCardQuantity(card.set, card.collectorNumber, delta);
            this.toast.emit({ message: delta > 0 ? 'Kopie hinzugefügt!' : 'Kopie entfernt.', type: 'success' });
        }
    }

    removeCard(index: number): void {
        this.inventoryService.removeCardByIndex(index);
        this.closeModal();
        this.toast.emit({ message: 'Karte entfernt.', type: 'success' });
    }

    async refreshPrices(): Promise<void> {
        const card = this.card();
        this.isRefreshingPrices.set(true);
        try {
            await this.inventoryService.refreshPricesForDetailView(
                card.set,
                card.collectorNumber
            );
            this.toast.emit({ message: 'Preise aktualisiert!', type: 'success' });
        } catch {
            this.toast.emit({ message: 'Preis-Aktualisierung fehlgeschlagen.', type: 'error' });
        } finally {
            this.isRefreshingPrices.set(false);
        }
    }
}
