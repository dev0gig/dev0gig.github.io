import { Injectable } from '@angular/core';

export interface ResizeOptions {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImageOptimiserService {

    /**
     * Create an object URL for a Blob or ArrayBuffer
     */
    createObjectUrl(data: Blob | ArrayBuffer, mimeType = 'image/jpeg'): string {
        const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
        return URL.createObjectURL(blob);
    }

    /**
     * Revoke an object URL to free memory
     */
    revokeObjectUrl(url: string): void {
        URL.revokeObjectURL(url);
    }

    /**
     * Load an image from a File, Blob, ArrayBuffer or URL
     */
    async loadImage(source: File | Blob | ArrayBuffer | string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                // Revoke object URL if we created one
                if (typeof source !== 'string' && img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
                resolve(img);
            };
            img.onerror = () => reject(new Error('Failed to load image'));

            if (typeof source === 'string') {
                img.src = source;
            } else if (source instanceof File || source instanceof Blob) {
                img.src = URL.createObjectURL(source);
            } else {
                img.src = URL.createObjectURL(new Blob([source]));
            }
        });
    }

    /**
     * Resize an image using canvas
     */
    async resizeImage(
        source: File | Blob | ArrayBuffer | string,
        options: ResizeOptions
    ): Promise<Blob> {
        const img = await this.loadImage(source);

        let { width, height } = options;
        const { maintainAspectRatio = true } = options;

        // If no dimensions provided, return original
        if (!width && !height) {
            if (source instanceof Blob || source instanceof File) {
                return source;
            }
            return new Blob([source as ArrayBuffer], { type: 'image/jpeg' });
        }

        // Calculate dimensions
        const aspectRatio = img.width / img.height;

        if (maintainAspectRatio) {
            if (width && !height) {
                height = Math.round(width / aspectRatio);
            } else if (height && !width) {
                width = Math.round(height * aspectRatio);
            } else if (width && height) {
                // Fit within bounds while maintaining aspect ratio
                const targetRatio = width / height;
                if (aspectRatio > targetRatio) {
                    height = Math.round(width / aspectRatio);
                } else {
                    width = Math.round(height * aspectRatio);
                }
            }
        }

        width = width || img.width;
        height = height || img.height;

        // Create canvas and draw
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Use high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
                'image/jpeg',
                0.92
            );
        });
    }

    /**
     * Get image dimensions without loading full image
     */
    async getImageDimensions(source: File | Blob | ArrayBuffer | string): Promise<{
        width: number;
        height: number;
    }> {
        const img = await this.loadImage(source);
        return { width: img.width, height: img.height };
    }

    /**
     * Fetch an image from URL and return as Blob
     */
    async fetchImageFromUrl(url: string): Promise<Blob> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        return await response.blob();
    }
}
