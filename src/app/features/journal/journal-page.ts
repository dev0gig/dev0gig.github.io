import { Component, signal, inject, effect, computed } from '@angular/core';
import { EntryList } from './entry-list/entry-list';
import { Calendar } from './calendar/calendar';
import { Search } from './search/search';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JournalService } from './journal';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { SidebarService } from '../../shared/sidebar.service';
import { SettingsService } from '../../shared/settings.service';

@Component({
    selector: 'app-journal-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, EntryList, Calendar, Search, AppsLauncher],
    templateUrl: './journal-page.html',
    styleUrl: './journal-page.css'
})
export class JournalPage {
    journal = inject(JournalService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    router = inject(Router);
    showSettingsModal = signal(false);
    showAllSearchTags = signal(false);
    currentYear = new Date().getFullYear();

    // OCR Import state
    isDragging = signal(false);
    ocrImportStatus = signal<{ success: boolean; message: string } | null>(null);

    // New Entry Modal state
    showNewEntryModal = signal(false);
    selectedDate = signal(this.getTodayIso());
    selectedTime = signal(this.getCurrentTimeIso());

    // Form fields for modal
    newEntryMainText = signal('');
    newEntrySysWin = signal('');
    newEntryLearn = signal('');
    newEntryImpulse = signal('');
    newEntryBeauty = signal('');

    // Store colors for consistent tag coloring
    private tagColors = new Map<string, string>();

    getTagColor(tag: string): string {
        if (this.tagColors.has(tag)) {
            return this.tagColors.get(tag)!;
        }

        // Pastel color palette
        const pastelColors = [
            'hsl(340, 70%, 85%)', // pink
            'hsl(210, 70%, 85%)', // blue
            'hsl(120, 50%, 80%)', // green
            'hsl(45, 80%, 85%)',  // yellow
            'hsl(280, 60%, 85%)', // purple
            'hsl(180, 60%, 80%)', // teal
            'hsl(30, 80%, 85%)',  // orange
            'hsl(0, 70%, 85%)',   // red
        ];

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = ((hash << 5) - hash) + tag.charCodeAt(i);
            hash |= 0;
        }

        const color = pastelColors[Math.abs(hash) % pastelColors.length];
        this.tagColors.set(tag, color);
        return color;
    }

    onTagClick(tag: string) {
        this.journal.searchByTag(tag);
    }

    toggleShowAllSearchTags() {
        this.showAllSearchTags.update(v => !v);
    }

    // Return limited tags (for 3 rows, approximately 12 tags) or all tags
    visibleSearchTags = computed(() => {
        const allTags = this.journal.searchResultTags();
        const maxTags = 12; // Approximately 3 rows
        if (this.showAllSearchTags() || allTags.length <= maxTags) {
            return allTags;
        }
        return allTags.slice(0, maxTags);
    });

    private getTodayIso(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    private getCurrentTimeIso(): string {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    toggleNewEntryModal() {
        this.showNewEntryModal.update(v => !v);
        // Reset fields when opening
        if (this.showNewEntryModal()) {
            this.selectedDate.set(this.getTodayIso());
            this.selectedTime.set(this.getCurrentTimeIso());
            this.newEntryMainText.set('');
            this.newEntrySysWin.set('');
            this.newEntryLearn.set('');
            this.newEntryImpulse.set('');
            this.newEntryBeauty.set('');
        }
    }

    saveStructuredEntry() {
        const parts: string[] = [];

        // Brain-Dump (main text)
        if (this.newEntryMainText().trim()) {
            parts.push(this.newEntryMainText().trim());
        }

        // Structured fields with labels
        const fields = [
            { label: '🏆 System-Win', value: this.newEntrySysWin() },
            { label: '💡 Lern-Moment', value: this.newEntryLearn() },
            { label: '⚖️ Impuls-Check', value: this.newEntryImpulse() },
            { label: '✨ Exzellenz-Anker', value: this.newEntryBeauty() }
        ];

        const filledFields = fields.filter(f => f.value.trim()).map(f => `${f.label}: ${f.value.trim()}`);

        if (filledFields.length > 0) {
            if (parts.length > 0) parts.push('---');
            parts.push(...filledFields);
        }

        const combinedText = parts.join('\n');

        if (combinedText) {
            const selectedDateStr = this.selectedDate();
            const selectedTimeStr = this.selectedTime();

            // Create date object from date and time inputs
            const dateObj = new Date(selectedDateStr);
            const [hours, minutes] = selectedTimeStr.split(':').map(Number);
            dateObj.setHours(hours);
            dateObj.setMinutes(minutes);

            this.journal.addEntryWithDate(combinedText, dateObj);
            this.showNewEntryModal.set(false);
        }
    }

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
    }
}
