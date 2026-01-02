import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MtgInventoryService } from '../../mtg-inventory.service';
import { ToastService } from '../../../../shared/toast.service';

@Component({
    selector: 'app-mtg-import-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mtg-import-modal.component.html'
})
export class MtgImportModalComponent {
    private inventoryService = inject(MtgInventoryService);
    private toastService = inject(ToastService);

    close = output<void>();

    // Local State
    importText = signal<string>('');
    selectedFileName = signal<string>('');
    lastImportResult = signal<{ success: number; failed: number } | null>(null);

    closeModal() {
        this.close.emit();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            this.selectedFileName.set(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                this.importText.set(content || '');
            };
            reader.readAsText(file);
        }
    }

    executeImport(): void {
        const text = this.importText().trim();
        if (!text) return;

        const result = this.inventoryService.importFromArenaFormat(text);
        this.lastImportResult.set(result);
        this.toastService.show(`Import: ${result.success} Karten hinzugefügt`, 'success');
    }
}
