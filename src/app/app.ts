import { Component, signal, inject } from '@angular/core';
import { EntryList } from './features/journal/entry-list/entry-list';
import { Calendar } from './features/journal/calendar/calendar';
import { Search } from './features/journal/search/search';
import { CommonModule } from '@angular/common';
import { JournalService } from './features/journal/journal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, EntryList, Calendar, Search],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  journal = inject(JournalService);
  isOnline = signal(true);
  showAppsModal = signal(false);
  showSettingsModal = signal(false);

  toggleAppsModal() {
    this.showAppsModal.update(v => !v);
  }

  toggleSettingsModal() {
    this.showSettingsModal.update(v => !v);
    // Close apps modal if settings is opened
    if (this.showSettingsModal()) {
      this.showAppsModal.set(false);
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

  deferredPrompt: any;
  canInstall = signal(false);

  constructor() {
    window.addEventListener('blur', () => this.isOnline.set(false));
    window.addEventListener('focus', () => this.isOnline.set(true));

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      this.canInstall.set(true);
    });
  }

  async installPwa() {
    if (!this.deferredPrompt) {
      return;
    }
    // Show the install prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }
}
