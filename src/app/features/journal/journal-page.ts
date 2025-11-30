import { Component, signal, inject } from '@angular/core';
import { EntryList } from './entry-list/entry-list';
import { Calendar } from './calendar/calendar';
import { Search } from './search/search';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JournalService } from './journal';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';

@Component({
    selector: 'app-journal-page',
    standalone: true,
    imports: [CommonModule, RouterModule, EntryList, Calendar, Search, AppsLauncher],
    templateUrl: './journal-page.html',
    styleUrl: './journal-page.css'
})
export class JournalPage {
    journal = inject(JournalService);
    isOnline = signal(true);
    showSettingsModal = signal(false);

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
    }

    async onExport() {
        const blob = await this.journal.exportData();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal_backup.zip';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    onImport(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            if (confirm('Warning: Importing data will overwrite all existing entries. Are you sure you want to proceed?')) {
                this.journal.importData(input.files[0]);
                this.toggleSettingsModal(); // Close modal after import
            } else {
                input.value = ''; // Clear input so same file can be selected again if needed
            }
        }
    }

    constructor() {
        window.addEventListener('blur', () => this.isOnline.set(false));
        window.addEventListener('focus', () => this.isOnline.set(true));
    }
}
