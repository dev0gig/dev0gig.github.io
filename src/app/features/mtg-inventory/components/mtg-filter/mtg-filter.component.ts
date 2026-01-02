import { Component, ElementRef, ViewChild, inject, input, signal, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MtgInventoryService } from '../../mtg-inventory.service';
import { ToastService } from '../../../../shared/toast.service';

@Component({
    selector: 'app-mtg-filter',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mtg-filter.component.html'
})
export class MtgFilterComponent {
    private inventoryService = inject(MtgInventoryService);
    private toastService = inject(ToastService);

    @ViewChild('setNumberInput') setNumberInput!: ElementRef<HTMLInputElement>;

    // Inputs / Models
    allSets = input<{ code: string; name: string; count: number }[]>([]);
    selectedSet = model<string | null>(null);
    searchTerm = model<string>('');



    // Local State
    inputSetNumber = signal<string>('');
    isAddingCard = signal<boolean>(false);
    showMobileSetFilter = signal<boolean>(false);

    // Actions
    onSearchTermChange(term: string) {
        this.searchTerm.set(term);
    }

    toggleMobileSetFilter() {
        this.showMobileSetFilter.update(v => !v);
    }

    selectSet(setCode: string | null) {
        this.selectedSet.set(setCode);
        // Since we are setting the model directly, the parent will get the update
    }

    async addCard(): Promise<void> {
        const input = this.inputSetNumber().trim().toUpperCase();

        if (!input) return;

        // Parse the input: expects format "SET-NUMBER" (e.g., "MH2-405")
        const separatorIndex = input.lastIndexOf('-');

        let set: string;
        let number: string;

        if (separatorIndex > 0) {
            // Found a hyphen, split accordingly
            set = input.substring(0, separatorIndex).trim();
            number = input.substring(separatorIndex + 1).trim();
        } else {
            // No hyphen found, show error
            this.toastService.show('Format: SET-# (z.B. MH2-405)', 'error');
            return;
        }

        if (!set || !number) {
            this.toastService.show('Format: SET-# (z.B. MH2-405)', 'error');
            return;
        }

        this.isAddingCard.set(true);

        try {
            const success = await this.inventoryService.addCardManually(set, number);

            if (success) {
                this.inputSetNumber.set('');
                this.toastService.show('Karte hinzugefügt!', 'success');
            } else {
                this.toastService.show('Karte nicht gefunden.', 'error');
            }
        } finally {
            this.isAddingCard.set(false);
            // Re-focus input for quick consecutive entries
            setTimeout(() => this.setNumberInput?.nativeElement?.focus(), 0);
        }
    }
}
