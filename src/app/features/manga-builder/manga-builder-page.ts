import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
    FileProcessorService,
    ChapterFile,
    ProgressState
} from './services/file-processor.service';
import { sortChapterFiles } from './utils/natural-sort.util';
import { ChapterSelectionComponent } from './components/chapter-selection/chapter-selection.component';
import { CoverManagementComponent, CoverData } from './components/cover-management/cover-management.component';
import { ProgressFeedbackComponent } from './components/progress-feedback/progress-feedback.component';
import { SidebarService } from '../../shared/sidebar.service';

@Component({
    selector: 'app-manga-builder-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ChapterSelectionComponent,
        CoverManagementComponent,
        ProgressFeedbackComponent
    ],
    templateUrl: './manga-builder-page.html',
    styleUrl: './manga-builder-page.css'
})
export class MangaBuilderPage {
    private fileProcessor = inject(FileProcessorService);
    private router = inject(Router);

    sidebarService = inject(SidebarService);

    chapters = signal<ChapterFile[]>([]);
    cover = signal<CoverData | null>(null);
    progress = signal<ProgressState>({ status: 'idle', message: '', progress: 0 });

    isProcessing = false;
    outputFilename = 'manga_merged.cbz';

    constructor() {
        this.fileProcessor.progress$.subscribe(p => this.progress.set(p));
    }

    toggleSidebar() {
        this.sidebarService.toggle();
    }

    toggleRightSidebar() {
        this.sidebarService.toggleRight();
    }

    async onFilesDropped(files: File[]) {
        this.isProcessing = true;

        try {
            const newChapters: ChapterFile[] = [];

            for (const file of files) {
                const ext = file.name.toLowerCase();

                if (ext.endsWith('.cbz') || ext.endsWith('.zip')) {
                    const extractedFiles = await this.fileProcessor.extractArchive(file);
                    newChapters.push({
                        name: file.name,
                        files: extractedFiles
                    });
                } else {
                    const data = await file.arrayBuffer();
                    const singleChapter: ChapterFile = {
                        name: file.name,
                        files: [{
                            name: file.name,
                            data,
                            type: file.type || 'image/jpeg'
                        }]
                    };
                    newChapters.push(singleChapter);
                }
            }

            const allChapters = [...this.chapters(), ...newChapters];
            const sorted = sortChapterFiles(allChapters);
            const withDuplicates = this.fileProcessor.detectDuplicates(sorted);

            this.chapters.set(withDuplicates);
        } catch (error) {
            console.error('Error processing files:', error);
        } finally {
            this.isProcessing = false;
            this.fileProcessor.resetProgress();
        }
    }

    onChaptersChange(chapters: ChapterFile[]) {
        this.chapters.set(this.fileProcessor.detectDuplicates(chapters));
    }

    onCoverChange(cover: CoverData | null) {
        this.cover.set(cover);
    }

    canMerge(): boolean {
        return this.chapters().length > 0 && !this.isProcessing;
    }

    async mergeCBZ() {
        if (!this.canMerge()) return;

        this.isProcessing = true;

        try {
            const allImages: { name: string; data: ArrayBuffer }[] = [];

            for (const chapter of this.chapters()) {
                for (const file of chapter.files) {
                    allImages.push({
                        name: file.name,
                        data: file.data
                    });
                }
            }

            const coverData = this.cover();
            const cbzBlob = await this.fileProcessor.createCBZ(
                allImages,
                undefined, // No metadata
                coverData ? {
                    data: coverData.blob,
                    name: 'cover.jpg'
                } : undefined
            );

            this.downloadBlob(cbzBlob, this.outputFilename);

            setTimeout(() => {
                this.fileProcessor.resetProgress();
            }, 2000);
        } catch (error) {
            console.error('Error creating CBZ:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    openReader() {
        this.router.navigate(['/manga-reader']);
    }

    clearAll() {
        this.chapters.set([]);
        this.cover.set(null);
        this.outputFilename = 'manga_merged.cbz';
    }

    getTotalImageCount(): number {
        return this.chapters().reduce((sum, ch) => sum + ch.files.length, 0);
    }
}
