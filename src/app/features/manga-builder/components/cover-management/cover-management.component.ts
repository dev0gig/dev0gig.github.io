import { Component, EventEmitter, Input, Output, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageOptimiserService } from '../../services/image-optimiser.service';

export interface CoverData {
    blob: Blob;
    previewUrl: string;
    name: string;
}

export interface CoverResizeOptions {
    enabled: boolean;
    width?: number;
    height?: number;
}

@Component({
    selector: 'app-cover-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cover-management.component.html',
    styleUrl: './cover-management.component.css'
})
export class CoverManagementComponent implements OnDestroy {
    private imageOptimiser = inject(ImageOptimiserService);

    @Input() cover: CoverData | null = null;
    @Output() coverChange = new EventEmitter<CoverData | null>();

    resizeOptions: CoverResizeOptions = {
        enabled: false,
        width: 1072,
        height: 1448
    };

    urlInput = '';
    isLoading = false;
    errorMessage = '';

    ngOnDestroy() {
        if (this.cover?.previewUrl) {
            this.imageOptimiser.revokeObjectUrl(this.cover.previewUrl);
        }
    }

    async onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        await this.processFile(input.files[0]);
        input.value = '';
    }

    async onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        const file = event.dataTransfer?.files[0];
        if (file && file.type.startsWith('image/')) {
            await this.processFile(file);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    async loadFromUrl() {
        if (!this.urlInput.trim()) return;

        this.isLoading = true;
        this.errorMessage = '';

        try {
            const blob = await this.imageOptimiser.fetchImageFromUrl(this.urlInput);
            await this.setCover(blob, 'cover_from_url.jpg');
            this.urlInput = '';
        } catch (e) {
            this.errorMessage = 'Bild konnte nicht geladen werden';
        } finally {
            this.isLoading = false;
        }
    }

    private async processFile(file: File) {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            let blob: Blob = file;

            if (this.resizeOptions.enabled && this.resizeOptions.width && this.resizeOptions.height) {
                blob = await this.imageOptimiser.resizeImage(file, {
                    width: this.resizeOptions.width,
                    height: this.resizeOptions.height,
                    maintainAspectRatio: true
                });
            }

            await this.setCover(blob, file.name);
        } catch (e) {
            this.errorMessage = 'Fehler beim Verarbeiten des Bildes';
        } finally {
            this.isLoading = false;
        }
    }

    private async setCover(blob: Blob, name: string) {
        // Revoke old preview URL
        if (this.cover?.previewUrl) {
            this.imageOptimiser.revokeObjectUrl(this.cover.previewUrl);
        }

        const previewUrl = this.imageOptimiser.createObjectUrl(blob);
        this.cover = { blob, previewUrl, name };
        this.coverChange.emit(this.cover);
    }

    removeCover() {
        if (this.cover?.previewUrl) {
            this.imageOptimiser.revokeObjectUrl(this.cover.previewUrl);
        }
        this.cover = null;
        this.coverChange.emit(null);
    }

    async applyResize() {
        if (!this.cover || !this.resizeOptions.enabled) return;

        this.isLoading = true;
        try {
            const resizedBlob = await this.imageOptimiser.resizeImage(this.cover.blob, {
                width: this.resizeOptions.width,
                height: this.resizeOptions.height,
                maintainAspectRatio: true
            });
            await this.setCover(resizedBlob, this.cover.name);
        } catch (e) {
            this.errorMessage = 'Fehler beim Skalieren';
        } finally {
            this.isLoading = false;
        }
    }
}
