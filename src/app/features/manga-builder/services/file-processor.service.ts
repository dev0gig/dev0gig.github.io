import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map, switchMap } from 'rxjs';

export interface ProgressState {
    status: 'idle' | 'extracting' | 'processing' | 'compressing' | 'complete' | 'error';
    message: string;
    progress: number; // 0-100
}

export interface ExtractedFile {
    name: string;
    data: ArrayBuffer;
    type: string;
}

export interface ChapterFile {
    name: string;
    files: ExtractedFile[];
    isDuplicate?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FileProcessorService {
    private progressSubject = new BehaviorSubject<ProgressState>({
        status: 'idle',
        message: '',
        progress: 0
    });

    progress$ = this.progressSubject.asObservable();

    private updateProgress(status: ProgressState['status'], message: string, progress: number) {
        this.progressSubject.next({ status, message, progress });
    }

    /**
     * Read a File as ArrayBuffer
     */
    readFileAsArrayBuffer(file: File): Observable<ArrayBuffer> {
        return new Observable(observer => {
            const reader = new FileReader();
            reader.onload = () => {
                observer.next(reader.result as ArrayBuffer);
                observer.complete();
            };
            reader.onerror = () => observer.error(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract images from a CBZ/ZIP archive
     */
    async extractArchive(file: File): Promise<ExtractedFile[]> {
        const JSZip = (await import('jszip')).default;
        this.updateProgress('extracting', `Entpacke ${file.name}...`, 0);

        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const imageFiles: ExtractedFile[] = [];
        const fileNames = Object.keys(zip.files).filter(name => {
            const lower = name.toLowerCase();
            return !zip.files[name].dir &&
                (lower.endsWith('.jpg') || lower.endsWith('.jpeg') ||
                    lower.endsWith('.png') || lower.endsWith('.webp') ||
                    lower.endsWith('.gif'));
        }).sort();

        let processed = 0;
        for (const fileName of fileNames) {
            const data = await zip.files[fileName].async('arraybuffer');
            const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = ext === 'png' ? 'image/png' :
                ext === 'webp' ? 'image/webp' :
                    ext === 'gif' ? 'image/gif' : 'image/jpeg';

            imageFiles.push({
                name: fileName.split('/').pop() || fileName,
                data,
                type: mimeType
            });

            processed++;
            this.updateProgress('extracting', `Entpacke ${file.name}...`,
                Math.round((processed / fileNames.length) * 100));
        }

        return imageFiles;
    }

    /**
     * Extract ComicInfo.xml from archive if present
     */
    async extractMetadata(file: File): Promise<string | null> {
        const JSZip = (await import('jszip')).default;
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const comicInfoFile = zip.file('ComicInfo.xml');
        if (comicInfoFile) {
            return await comicInfoFile.async('string');
        }
        return null;
    }

    /**
     * Create a CBZ archive from images and metadata
     */
    async createCBZ(
        images: { name: string; data: Blob | ArrayBuffer }[],
        metadata?: string,
        coverImage?: { data: Blob | ArrayBuffer; name: string }
    ): Promise<Blob> {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        this.updateProgress('compressing', 'Erstelle CBZ...', 0);

        // Add cover first if provided (000_cover.jpg)
        if (coverImage) {
            const coverData = coverImage.data instanceof Blob
                ? await coverImage.data.arrayBuffer()
                : coverImage.data;
            zip.file(`000_${coverImage.name}`, coverData);
        }

        // Add images with padded numbering
        const padLength = String(images.length).length;
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const ext = img.name.split('.').pop() || 'jpg';
            const paddedNum = String(i + 1).padStart(padLength, '0');
            const fileName = `${paddedNum}.${ext}`;

            const imgData = img.data instanceof Blob
                ? await img.data.arrayBuffer()
                : img.data;
            zip.file(fileName, imgData);

            this.updateProgress('compressing', `Füge Bild ${i + 1}/${images.length} hinzu...`,
                Math.round(((i + 1) / images.length) * 80));
        }

        // Add metadata
        if (metadata) {
            zip.file('ComicInfo.xml', metadata);
        }

        this.updateProgress('compressing', 'Finalisiere Archiv...', 90);

        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        this.updateProgress('complete', 'CBZ erstellt!', 100);

        return blob;
    }

    /**
     * Detect duplicate chapters based on filename similarity
     */
    detectDuplicates(chapters: ChapterFile[]): ChapterFile[] {
        const seen = new Map<string, number>();

        return chapters.map(chapter => {
            // Normalize name for comparison
            const normalized = chapter.name
                .toLowerCase()
                .replace(/\.(cbz|zip)$/i, '')
                .replace(/[\s_-]+/g, ' ')
                .trim();

            if (seen.has(normalized)) {
                return { ...chapter, isDuplicate: true };
            }
            seen.set(normalized, 1);
            return chapter;
        });
    }

    /**
     * Reset progress state
     */
    resetProgress() {
        this.updateProgress('idle', '', 0);
    }
}
