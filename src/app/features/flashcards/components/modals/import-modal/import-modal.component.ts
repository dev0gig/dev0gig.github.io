import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-import-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './import-modal.component.html'
})
export class ImportModalComponent {
    closed = output<void>();
    imported = output<{ content: string; deckName: string }>();

    selectedFileName = signal('');
    selectedFileContent = signal('');
    lastImportResult = signal<{ success: number; failed: number } | null>(null);

    close(): void {
        this.closed.emit();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
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

    executeImport(): void {
        const content = this.selectedFileContent().trim();
        const deckName = this.selectedFileName().trim();
        if (!content) return;

        this.imported.emit({ content, deckName });
    }

    setImportResult(result: { success: number; failed: number }): void {
        this.lastImportResult.set(result);
    }
}
