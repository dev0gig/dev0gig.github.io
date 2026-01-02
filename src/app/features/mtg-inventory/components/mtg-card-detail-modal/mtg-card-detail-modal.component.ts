import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MtgInventoryService } from '../../mtg-inventory.service';
import { MtgCardBasic } from '../../mtg-card.model';
import { ToastService } from '../../../../shared/toast.service';

@Component({
    selector: 'app-mtg-card-detail-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mtg-card-detail-modal.component.html'
})
export class MtgCardDetailModalComponent {
    private inventoryService = inject(MtgInventoryService);
    private toastService = inject(ToastService);

    // Inputs
    card = input.required<MtgCardBasic>();
    index = input.required<number>();

    close = output<void>();

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
            this.toastService.show('Karte aus Sammlung entfernt.', 'success');
        } else {
            this.inventoryService.updateCardQuantity(card.set, card.collectorNumber, delta);
            this.toastService.show(delta > 0 ? 'Kopie hinzugefügt!' : 'Kopie entfernt.', 'success');
        }
    }

    removeCard(index: number): void {
        this.inventoryService.removeCardByIndex(index);
        this.closeModal();
        this.toastService.show('Karte entfernt.', 'success');
    }

    async refreshPrices(): Promise<void> {
        const card = this.card();
        this.isRefreshingPrices.set(true);
        try {
            await this.inventoryService.refreshPricesForDetailView(
                card.set,
                card.collectorNumber
            );
            this.toastService.show('Preise aktualisiert!', 'success');
        } catch {
            this.toastService.show('Preis-Aktualisierung fehlgeschlagen.', 'error');
        } finally {
            this.isRefreshingPrices.set(false);
        }
    }
}
