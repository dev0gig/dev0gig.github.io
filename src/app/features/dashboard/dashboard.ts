import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { BookmarkService } from '../../shared/bookmark.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, AppsLauncher],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
// Dashboard component with apps modal
export class Dashboard {
    bookmarkService = inject(BookmarkService);
    router = inject(Router);
    isOnline = signal(true);
    showSettingsModal = signal(false);

    newBookmarkUrl = '';
    newBookmarkName = '';
    searchTerm = signal('');

    filteredBookmarks = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const bookmarks = this.bookmarkService.bookmarks();

        if (!term) return bookmarks;

        return bookmarks.filter(b =>
            b.name.toLowerCase().includes(term) ||
            b.url.toLowerCase().includes(term)
        );
    });

    onBookmarkClick() {
        if (this.searchTerm()) {
            this.searchTerm.set('');
        }
    }

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
    }

    isEditMode = signal(false);
    editingBookmark: { id: string, name: string, url: string } | null = null;

    toggleEditMode() {
        this.isEditMode.update(v => !v);
        this.editingBookmark = null; // Reset editing state when toggling mode
    }

    startEditingBookmark(bookmark: any) {
        this.editingBookmark = { ...bookmark };
    }

    saveEditedBookmark() {
        if (this.editingBookmark && this.editingBookmark.name && this.editingBookmark.url) {
            this.bookmarkService.updateBookmark(this.editingBookmark.id, {
                name: this.editingBookmark.name,
                url: this.editingBookmark.url
            });
            this.editingBookmark = null;
        }
    }

    cancelEditingBookmark() {
        this.editingBookmark = null;
    }

    addBookmark() {
        if (this.newBookmarkUrl && this.newBookmarkName) {
            this.bookmarkService.addBookmark(this.newBookmarkUrl, this.newBookmarkName);
            this.newBookmarkUrl = '';
            this.newBookmarkName = '';
        }
    }

    navigateToJournal() {
        this.router.navigate(['/journal']);
    }

    navigateToBudget() {
        this.router.navigate(['/budget']);
    }

    exportBookmarks() {
        const bookmarks = this.bookmarkService.bookmarks();
        const date = Math.floor(Date.now() / 1000);

        let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${date}" LAST_MODIFIED="${date}">dev0gig Dashboard</H3>
    <DL><p>
`;

        bookmarks.forEach(b => {
            const addDate = Math.floor(b.createdAt / 1000);
            html += `        <DT><A HREF="${b.url}" ADD_DATE="${addDate}">${b.name}</A>\n`;
        });

        html += `    </DL><p>
</DL><p>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks_${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        input.click();
    }

    private processImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            this.parseAndImportBookmarks(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportBookmarks(html: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.getElementsByTagName('a');
        const bookmarksToImport: { url: string; name: string; createdAt?: number }[] = [];

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const url = link.href;
            const name = link.textContent || url;
            const addDateStr = link.getAttribute('add_date');
            let createdAt = Date.now();

            if (addDateStr) {
                try {
                    // Chrome exports timestamps in seconds, JS uses milliseconds
                    createdAt = parseInt(addDateStr) * 1000;
                } catch (e) {
                    console.warn('Invalid date in bookmark', e);
                }
            }

            if (url && !url.startsWith('place:')) { // Ignore smart bookmarks
                bookmarksToImport.push({ url, name, createdAt });
            }
        }

        if (bookmarksToImport.length > 0) {
            this.bookmarkService.importBookmarks(bookmarksToImport);
            this.toggleSettingsModal(); // Close modal on success
            alert(`${bookmarksToImport.length} Lesezeichen erfolgreich importiert.`);
        } else {
            alert('Keine Lesezeichen in der Datei gefunden.');
        }
    }

    downloadMangaBuilder() {
        if (confirm('Möchten Sie das Manga Builder Tool herunterladen?')) {
            const link = document.createElement('a');
            link.href = 'manga_builder_gui.exe';
            link.download = 'manga_builder_gui.exe';
            link.click();
        }
    }

    constructor() {
        window.addEventListener('blur', () => this.isOnline.set(false));
        window.addEventListener('focus', () => this.isOnline.set(true));
    }
}
