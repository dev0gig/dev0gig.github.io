import { Injectable, signal, effect } from '@angular/core';

export interface Bookmark {
    id: string;
    url: string;
    name: string;
    isFavorite: boolean;
    createdAt: number;
}

@Injectable({
    providedIn: 'root'
})
export class BookmarkService {
    bookmarks = signal<Bookmark[]>([]);

    constructor() {
        this.loadBookmarks();

        effect(() => {
            this.saveBookmarks();
        });
    }

    private sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
        return bookmarks.sort((a, b) => a.name.localeCompare(b.name));
    }

    private loadBookmarks() {
        const saved = localStorage.getItem('dev0gig_bookmarks');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.bookmarks.set(this.sortBookmarks(parsed));
            } catch (e) {
                console.error('Failed to parse bookmarks', e);
            }
        }
    }

    private saveBookmarks() {
        localStorage.setItem('dev0gig_bookmarks', JSON.stringify(this.bookmarks()));
    }

    addBookmark(url: string, name: string) {
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const newBookmark: Bookmark = {
            id: crypto.randomUUID(),
            url,
            name,
            isFavorite: false,
            createdAt: Date.now()
        };

        this.bookmarks.update(current => this.sortBookmarks([newBookmark, ...current]));
    }

    updateBookmark(id: string, updates: Partial<Bookmark>) {
        this.bookmarks.update(current => {
            const updated = current.map(b => b.id === id ? { ...b, ...updates } : b);
            return this.sortBookmarks(updated);
        });
    }

    removeBookmark(id: string) {
        this.bookmarks.update(current => current.filter(b => b.id !== id));
    }

    toggleFavorite(id: string) {
        this.bookmarks.update(current =>
            current.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b)
        );
    }

    getFaviconUrl(url: string): string {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return ''; // Fallback or handle invalid URL
        }
    }

    importBookmarks(newBookmarks: { url: string; name: string; createdAt?: number }[]) {
        const bookmarksToAdd: Bookmark[] = newBookmarks.map(b => {
            let url = b.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return {
                id: crypto.randomUUID(),
                url,
                name: b.name,
                isFavorite: false,
                createdAt: b.createdAt || Date.now()
            };
        });

        this.bookmarks.update(current => this.sortBookmarks([...bookmarksToAdd, ...current]));
    }
}
