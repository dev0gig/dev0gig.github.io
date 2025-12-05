import { Component, signal, inject, effect } from '@angular/core';
import { EntryList } from './entry-list/entry-list';
import { Calendar } from './calendar/calendar';
import { Search } from './search/search';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JournalService } from './journal';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { SettingsService } from '../../shared/settings.service';

@Component({
    selector: 'app-journal-page',
    standalone: true,
    imports: [CommonModule, RouterModule, EntryList, Calendar, Search, AppsLauncher],
    templateUrl: './journal-page.html',
    styleUrl: './journal-page.css'
})
export class JournalPage {
    journal = inject(JournalService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    router = inject(Router);
    isOnline = signal(true);
    showSettingsModal = signal(false);
    currentYear = new Date().getFullYear();

    // OCR Import state
    isDragging = signal(false);
    ocrImportStatus = signal<{ success: boolean; message: string } | null>(null);

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
    }

    toggleRightSidebar() {
        this.sidebarService.toggleRight();
    }

    onMonthClick(month: number) {
        this.journal.setMonthFilter(this.currentYear, month);
    }

    isMonthSelected(month: number): boolean {
        const filter = this.journal.monthFilter();
        return filter !== null && filter.year === this.currentYear && filter.month === month;
    }

    toggleDuplicateFilter() {
        if (this.journal.duplicateFilter()) {
            this.journal.clearDuplicateFilter();
        } else {
            this.journal.setDuplicateFilter(true);
        }
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

    async onImport(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            if (confirm('Warning: Importing data will overwrite all existing entries. Are you sure you want to proceed?')) {
                try {
                    const count = await this.journal.importData(input.files[0]);
                    if (count > 0) {
                        alert(`Successfully imported ${count} entries.`);
                    } else {
                        alert('No valid entries found in the selected file.');
                    }
                } catch (e) {
                    console.error('Import failed', e);
                    alert('Import failed. Please check the file format.');
                }
                this.toggleSettingsModal(); // Close modal after import
            }
            input.value = ''; // Clear input so same file can be selected again
        }
    }

    onDeleteAll() {
        if (confirm('Warning: This will permanently delete ALL journal entries. This action cannot be undone. Are you sure?')) {
            this.journal.deleteAllEntries();
            this.toggleSettingsModal();
            alert('All entries have been deleted.');
        }
    }

    // OCR File Import handlers
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processOcrFile(files[0]);
        }
    }

    onOcrFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processOcrFile(input.files[0]);
            input.value = ''; // Reset so same file can be selected again
        }
    }

    private async processOcrFile(file: File) {
        // Clear previous status
        this.ocrImportStatus.set(null);

        // Validate file type
        if (!file.name.endsWith('.txt')) {
            this.ocrImportStatus.set({
                success: false,
                message: 'Please select a .txt file'
            });
            return;
        }

        try {
            const text = await file.text();
            const result = this.journal.importOcrText(text);

            if (result.success && result.date) {
                const dateStr = result.date.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                this.ocrImportStatus.set({
                    success: true,
                    message: `Entry added for ${dateStr}`
                });

                // Clear success message after 3 seconds
                setTimeout(() => {
                    this.ocrImportStatus.set(null);
                }, 3000);
            } else {
                this.ocrImportStatus.set({
                    success: false,
                    message: result.error || 'Failed to import file'
                });
            }
        } catch (e) {
            console.error('OCR file processing failed', e);
            this.ocrImportStatus.set({
                success: false,
                message: 'Failed to read file'
            });
        }
    }

    constructor() {
        // Close settings modal on route change
        this.router.events.subscribe(() => {
            if (this.showSettingsModal()) {
                this.showSettingsModal.set(false);
            }
        });

        // Listen to settings service trigger - only react to NEW changes (not existing trigger value)
        let previousTrigger = this.settingsService.trigger();
        effect(() => {
            const trigger = this.settingsService.trigger();
            if (trigger > previousTrigger) {
                this.showSettingsModal.set(true);
                previousTrigger = trigger;
            }
        });
    }
}
