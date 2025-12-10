import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChapterFile } from '../../services/file-processor.service';
import { sortChapterFiles } from '../../utils/natural-sort.util';

@Component({
    selector: 'app-chapter-selection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chapter-selection.component.html',
    styleUrl: './chapter-selection.component.css'
})
export class ChapterSelectionComponent {
    @Input() chapters: ChapterFile[] = [];
    @Output() chaptersChange = new EventEmitter<ChapterFile[]>();
    @Output() filesDropped = new EventEmitter<File[]>();

    isDragging = false;

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = this.extractFiles(event.dataTransfer);
        if (files.length > 0) {
            this.filesDropped.emit(files);
        }
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);
            this.filesDropped.emit(files);
            input.value = '';
        }
    }

    private extractFiles(dataTransfer: DataTransfer | null): File[] {
        if (!dataTransfer) return [];

        const files: File[] = [];
        for (let i = 0; i < dataTransfer.files.length; i++) {
            const file = dataTransfer.files[i];
            if (this.isValidFile(file)) {
                files.push(file);
            }
        }
        return files;
    }

    private isValidFile(file: File): boolean {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.cbz') || ext.endsWith('.zip') ||
            ext.endsWith('.jpg') || ext.endsWith('.jpeg') ||
            ext.endsWith('.png') || ext.endsWith('.webp');
    }

    removeChapter(index: number) {
        const updated = [...this.chapters];
        updated.splice(index, 1);
        this.chaptersChange.emit(updated);
    }

    moveUp(index: number) {
        if (index <= 0) return;
        const updated = [...this.chapters];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        this.chaptersChange.emit(updated);
    }

    moveDown(index: number) {
        if (index >= this.chapters.length - 1) return;
        const updated = [...this.chapters];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        this.chaptersChange.emit(updated);
    }

    sortChapters() {
        const sorted = sortChapterFiles(this.chapters);
        this.chaptersChange.emit(sorted);
    }

    clearAll() {
        this.chaptersChange.emit([]);
    }

    getTotalImages(): number {
        return this.chapters.reduce((sum, ch) => sum + ch.files.length, 0);
    }
}
