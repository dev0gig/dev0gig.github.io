import { Injectable, signal, computed, effect } from '@angular/core';

export interface JournalEntry {
  id: string;
  date: Date;
  text: string;
}

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private readonly STORAGE_KEY = 'terminal_journal_entries';

  // Main state
  private entriesSignal = signal<JournalEntry[]>(this.loadEntries());
  private searchQuerySignal = signal<string>('');

  // Navigation state
  readonly currentDate = signal(new Date());

  // Public readonly signals
  readonly entries = this.entriesSignal.asReadonly();
  readonly storageUsage = signal<string>('0 KB');

  readonly displayEntries = computed(() => {
    const query = this.searchQuerySignal().toLowerCase();
    const entries = this.entriesSignal();
    let result = entries;

    if (query) {
      result = entries.filter(e => e.text.toLowerCase().includes(query));
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  constructor() {
    // Auto-save effect
    effect(() => {
      this.saveEntries(this.entriesSignal());
    });

    // Initial calculation
    this.calculateUsage();
  }

  setSearchQuery(query: string) {
    this.searchQuerySignal.set(query);
  }

  setCurrentDate(date: Date) {
    this.currentDate.set(date);
  }

  prevMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() - 1);
      return newDate;
    });
  }

  nextMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() + 1);
      return newDate;
    });
  }

  addEntry(text: string) {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      text: text,
    };
    this.entriesSignal.update(entries => [newEntry, ...entries]);
  }

  deleteEntry(id: string) {
    this.entriesSignal.update(entries => entries.filter(e => e.id !== id));
  }

  updateEntry(id: string, text: string) {
    this.entriesSignal.update(entries =>
      entries.map(e => e.id === id ? { ...e, text } : e)
    );
  }

  getEntriesByDate(date: Date): JournalEntry[] {
    return this.entriesSignal().filter(e =>
      this.isSameDay(e.date, date)
    );
  }

  private loadEntries(): JournalEntry[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((e: any) => ({
        ...e,
        date: new Date(e.date)
      }));
    } catch {
      return [];
    }
  }

  private saveEntries(entries: JournalEntry[]) {
    const json = JSON.stringify(entries);
    localStorage.setItem(this.STORAGE_KEY, json);
    this.calculateUsage();
  }

  private async calculateUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const bytes = estimate.usage || 0;

        if (bytes < 1024) {
          this.storageUsage.set(`${bytes} B`);
        } else if (bytes < 1024 * 1024) {
          this.storageUsage.set(`${(bytes / 1024).toFixed(2)} KB`);
        } else {
          this.storageUsage.set(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        }
        return;
      } catch (e) {
        console.warn('Storage estimate failed', e);
      }
    }

    // Fallback to local calculation
    const stored = localStorage.getItem(this.STORAGE_KEY) || '';
    const bytes = new Blob([stored]).size;

    if (bytes < 1024) {
      this.storageUsage.set(`${bytes} B`);
    } else {
      this.storageUsage.set(`${(bytes / 1024).toFixed(2)} KB`);
    }
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  async exportData(): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const entries = this.entriesSignal();

    // Group entries by date
    const entriesByDate = new Map<string, string[]>();

    for (const entry of entries) {
      const dateStr = entry.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const current = entriesByDate.get(dateStr) || [];
      current.push(entry.text);
      entriesByDate.set(dateStr, current);
    }

    // Add files to zip
    for (const [dateStr, texts] of entriesByDate) {
      // Join multiple entries for the same day with a separator
      const content = texts.join('\n\n---\n\n');
      zip.file(`${dateStr}.txt`, content);
    }

    return zip.generateAsync({ type: 'blob' });
  }

  async importData(file: File): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const newEntries: JournalEntry[] = [];

    // Iterate through files
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir || !filename.endsWith('.txt')) continue;

      // Parse date from filename (YYYY-MM-DD.txt)
      const dateStr = filename.replace('.txt', '');
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) continue;

      const content = await zipEntry.async('string');

      if (!content || !content.trim()) continue;

      // Create a new entry for this date
      // We treat the entire file content as one entry for simplicity, 
      // or we could try to split it back if we really wanted to.
      // Given the requirement "pro tag ein txt file", one entry per day seems appropriate 
      // or at least acceptable for import.

      newEntries.push({
        id: crypto.randomUUID(),
        date: date,
        text: content
      });
    }

    if (newEntries.length > 0) {
      this.entriesSignal.set(newEntries);
    }
  }
}
