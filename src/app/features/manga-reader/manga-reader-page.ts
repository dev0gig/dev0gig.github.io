import { Component, inject, signal, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FileProcessorService, ExtractedFile } from '../manga-builder/services/file-processor.service';
import { ImageOptimiserService } from '../manga-builder/services/image-optimiser.service';
import { SidebarService } from '../../shared/sidebar.service';
import { ThemeService } from '../../shared/theme.service';

@Component({
    selector: 'app-manga-reader-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './manga-reader-page.html',
    styleUrl: './manga-reader-page.css'
})
export class MangaReaderPage implements OnDestroy {
    private fileProcessor = inject(FileProcessorService);
    private imageOptimiser = inject(ImageOptimiserService);
    private router = inject(Router);

    sidebarService = inject(SidebarService);
    themeService = inject(ThemeService);

    pages = signal<{ url: string; name: string }[]>([]);
    currentPage = signal(0);
    isLoading = signal(false);
    fileName = signal('');
    isFullscreen = signal(false);
    showControls = signal(true);

    private controlTimeout: any;
    private pageUrls: string[] = [];

    ngOnDestroy() {
        this.revokeAllUrls();
    }

    toggleSidebar() {
        this.sidebarService.toggle();
    }

    async onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        await this.loadFile(input.files[0]);
        input.value = '';
    }

    async loadFile(file: File) {
        this.isLoading.set(true);
        this.revokeAllUrls();

        try {
            const extractedFiles = await this.fileProcessor.extractArchive(file);

            const pageData = extractedFiles.map(f => ({
                url: this.imageOptimiser.createObjectUrl(f.data, f.type),
                name: f.name
            }));

            this.pageUrls = pageData.map(p => p.url);
            this.pages.set(pageData);
            this.currentPage.set(0);
            this.fileName.set(file.name);
        } catch (error) {
            console.error('Error loading file:', error);
        } finally {
            this.isLoading.set(false);
            this.fileProcessor.resetProgress();
        }
    }

    private revokeAllUrls() {
        for (const url of this.pageUrls) {
            this.imageOptimiser.revokeObjectUrl(url);
        }
        this.pageUrls = [];
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (this.pages().length === 0) return;

        switch (event.key) {
            case 'ArrowRight':
            case ' ':
                this.nextPage();
                event.preventDefault();
                break;
            case 'ArrowLeft':
                this.prevPage();
                event.preventDefault();
                break;
            case 'Home':
                this.goToPage(0);
                event.preventDefault();
                break;
            case 'End':
                this.goToPage(this.pages().length - 1);
                event.preventDefault();
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case 'Escape':
                if (this.isFullscreen()) {
                    this.toggleFullscreen();
                }
                break;
        }
    }

    onPageClick(event: MouseEvent) {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const centerX = rect.width / 2;

        // Click on left half goes back, right half goes forward
        if (clickX < centerX) {
            this.prevPage();
        } else {
            this.nextPage();
        }

        this.showControlsTemporarily();
    }

    onMouseMove() {
        this.showControlsTemporarily();
    }

    private showControlsTemporarily() {
        this.showControls.set(true);
        clearTimeout(this.controlTimeout);
        this.controlTimeout = setTimeout(() => {
            if (this.isFullscreen()) {
                this.showControls.set(false);
            }
        }, 2000);
    }

    prevPage() {
        if (this.currentPage() > 0) {
            this.currentPage.update(p => p - 1);
        }
    }

    nextPage() {
        if (this.currentPage() < this.pages().length - 1) {
            this.currentPage.update(p => p + 1);
        }
    }

    goToPage(index: number) {
        if (index >= 0 && index < this.pages().length) {
            this.currentPage.set(index);
        }
    }

    toggleFullscreen() {
        this.isFullscreen.update(f => !f);
        if (this.isFullscreen()) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            this.showControls.set(true);
        }
    }

    goToBuilder() {
        this.router.navigate(['/manga-builder']);
    }

    getCurrentPageUrl(): string {
        const pages = this.pages();
        const current = this.currentPage();
        return pages[current]?.url || '';
    }
}
