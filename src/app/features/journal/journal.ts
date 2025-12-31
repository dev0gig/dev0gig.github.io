import { Injectable, signal, computed, effect } from '@angular/core';

export interface JournalEntry {
  id: string;
  date: Date;
  text: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private readonly STORAGE_KEY = 'terminal_journal_entries';

  // Main state
  private entriesSignal = signal<JournalEntry[]>(this.loadEntries());
  private searchQuerySignal = signal<string>('');

  // Flag to skip initial effect execution
  private isInitialized = false;

  // Navigation state
  readonly currentDate = signal(new Date());

  // Public readonly signals
  readonly entries = this.entriesSignal.asReadonly();
  readonly storageUsage = signal<string>('0 KB');

  // Month filter state (null = no filter, show all)
  private selectedMonthFilter = signal<{ year: number; month: number } | null>(null);
  readonly monthFilter = this.selectedMonthFilter.asReadonly();

  // Duplicate filter state
  private showDuplicatesOnly = signal<boolean>(false);
  readonly duplicateFilter = this.showDuplicatesOnly.asReadonly();

  // Global search active state
  readonly isGlobalSearchActive = computed(() => this.searchQuerySignal().length > 0);

  readonly displayEntries = computed(() => {
    const query = this.searchQuerySignal().toLowerCase();
    const monthFilter = this.selectedMonthFilter();
    const duplicateFilter = this.showDuplicatesOnly();
    const entries = this.entriesSignal();
    let result = entries;

    // Apply month filter first (but skip if global search is active)
    if (monthFilter && !query) {
      result = result.filter(e =>
        e.date.getFullYear() === monthFilter.year &&
        e.date.getMonth() === monthFilter.month
      );
    }

    // Apply duplicate filter
    if (duplicateFilter) {
      const duplicates = this.duplicateDates();
      result = result.filter(e => duplicates.has(this.getDateKey(e.date)));
    }

    // Then apply search query
    if (query) {
      result = result.filter(e => e.text.toLowerCase().includes(query));
    }

    // Sort by date only (ignore time)
    return result.sort((a, b) => {
      const dateA = new Date(a.date.getFullYear(), a.date.getMonth(), a.date.getDate()).getTime();
      const dateB = new Date(b.date.getFullYear(), b.date.getMonth(), b.date.getDate()).getTime();
      return dateB - dateA;
    });
  });

  // Detect duplicate dates (entries with the same date)
  readonly duplicateDates = computed(() => {
    const entries = this.entriesSignal();
    const dateCount = new Map<string, number>();

    // Count entries per date (using date string without time)
    for (const entry of entries) {
      const dateKey = this.getDateKey(entry.date);
      dateCount.set(dateKey, (dateCount.get(dateKey) || 0) + 1);
    }

    // Return set of date keys that have more than one entry
    const duplicates = new Set<string>();
    for (const [dateKey, count] of dateCount) {
      if (count > 1) {
        duplicates.add(dateKey);
      }
    }
    return duplicates;
  });

  // Check if an entry has a duplicate date
  hasDuplicateDate(entry: JournalEntry): boolean {
    const dateKey = this.getDateKey(entry.date);
    return this.duplicateDates().has(dateKey);
  }

  // Count of entries with duplicate dates
  readonly duplicateEntriesCount = computed(() => {
    const entries = this.entriesSignal();
    const duplicates = this.duplicateDates();
    return entries.filter(e => duplicates.has(this.getDateKey(e.date))).length;
  });

  // Helper to get date key (YYYY-MM-DD format)
  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get entries count per month for the current year
  readonly monthlyEntryCounts = computed(() => {
    const entries = this.entriesSignal();
    const currentYear = new Date().getFullYear();
    const counts: { month: number; name: string; count: number }[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const count = entries.filter(e =>
        e.date.getFullYear() === currentYear &&
        e.date.getMonth() === i
      ).length;
      counts.push({ month: i, name: monthNames[i], count });
    }

    return counts;
  });

  // Tags from currently viewed month (for Tag Cloud)
  readonly monthlyTags = computed(() => {
    // Use selected month filter if set, otherwise use current calendar view month
    const current = this.currentDate();
    const monthFilter = this.selectedMonthFilter();
    const year = monthFilter ? monthFilter.year : current.getFullYear();
    const month = monthFilter ? monthFilter.month : current.getMonth();

    const entries = this.entriesSignal().filter(e =>
      e.date.getFullYear() === year &&
      e.date.getMonth() === month
    );

    const tagCounts = new Map<string, number>();
    for (const entry of entries) {
      for (const tag of entry.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  });

  // Tags from current search results
  readonly searchResultTags = computed(() => {
    const query = this.searchQuerySignal().toLowerCase();
    if (!query) return [];

    const entries = this.displayEntries();
    const tagCounts = new Map<string, number>();

    for (const entry of entries) {
      for (const tag of entry.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  });

  // Extract hashtags from text
  private extractTags(text: string): string[] {
    const regex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = match[1].toLowerCase();
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
    return tags;
  }

  constructor() {
    // Auto-save effect - skip first execution to avoid overwriting loaded data
    effect(() => {
      const entries = this.entriesSignal();

      // Skip the first execution (when loading from localStorage)
      if (!this.isInitialized) {
        this.isInitialized = true;
        return;
      }

      this.saveEntries(entries);
    });

    // Initial calculation
    this.calculateUsage();
  }

  setSearchQuery(query: string) {
    this.searchQuerySignal.set(query);
  }

  clearSearch() {
    this.searchQuerySignal.set('');
  }

  searchByTag(tag: string) {
    this.searchQuerySignal.set(`#${tag}`);
  }

  setCurrentDate(date: Date) {
    this.currentDate.set(date);
  }

  setMonthFilter(year: number, month: number) {
    this.selectedMonthFilter.set({ year, month });
    // Also navigate calendar to that month
    this.currentDate.set(new Date(year, month, 1));
  }

  clearMonthFilter() {
    this.selectedMonthFilter.set(null);
  }

  setDuplicateFilter(show: boolean) {
    this.showDuplicatesOnly.set(show);
    // Clear month filter when showing duplicates
    if (show) {
      this.selectedMonthFilter.set(null);
    }
  }

  clearDuplicateFilter() {
    this.showDuplicatesOnly.set(false);
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

  goToToday() {
    this.currentDate.set(new Date());
  }

  addEntry(text: string) {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      text: text,
      tags: this.extractTags(text),
    };
    this.entriesSignal.update(entries => [newEntry, ...entries]);
  }

  addEntryWithDate(text: string, date: Date) {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: date,
      text: text,
      tags: this.extractTags(text),
    };
    this.entriesSignal.update(entries => [newEntry, ...entries]);
  }

  /**
   * Clean OCR text by removing excessive whitespace and formatting paragraphs
   * OCR often produces text with multiple spaces between words
   *
   * Rules:
   * - First line is the date (handled separately)
   * - Lines starting with "-" create new paragraphs
   * - Lines without "-" are joined to the previous line as flowing text
   */
  cleanOcrText(text: string): string {
    // First, clean up excessive whitespace in each line
    const lines = text.split('\n').map(line => {
      return line
        // Replace multiple spaces with single space
        .replace(/  +/g, ' ')
        // Fix spaces before punctuation
        .replace(/ ([.,!?;:])/g, '$1')
        // Fix spaces after opening brackets/quotes
        .replace(/([(\[„"']) /g, '$1')
        // Fix spaces before closing brackets/quotes
        .replace(/ ([)\]"'"])/g, '$1')
        // Trim the line
        .trim();
    }).filter(line => line.length > 0); // Remove empty lines

    if (lines.length === 0) return '';

    // First line is the date, keep it separate
    const result: string[] = [lines[0]];
    let currentParagraph = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Check if line starts with "-" (new paragraph/bullet point marker)
      if (line.startsWith('-')) {
        // Save current paragraph if exists
        if (currentParagraph) {
          result.push(currentParagraph);
          currentParagraph = '';
        }
        // Start new paragraph, keep the "-" as bullet point
        currentParagraph = '- ' + line.substring(1).trim();
      } else {
        // Join to current paragraph with space
        if (currentParagraph) {
          // Handle hyphenated words at end of line (word- next -> wordnext)
          if (currentParagraph.endsWith('-')) {
            currentParagraph = currentParagraph.slice(0, -1) + line;
          } else {
            currentParagraph += ' ' + line;
          }
        } else {
          currentParagraph = line;
        }
      }
    }

    // Don't forget the last paragraph
    if (currentParagraph) {
      result.push(currentParagraph);
    }

    return result.join('\n');
  }

  /**
   * Parse date from first line of OCR text
   * Supports formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
   */
  parseDateFromText(text: string): { date: Date | null; remainingText: string } {
    const lines = text.split('\n');
    if (lines.length === 0) {
      return { date: null, remainingText: text };
    }

    const firstLine = lines[0].trim();

    // Try to parse date in format DD.MM.YYYY, DD/MM/YYYY, or DD-MM-YYYY
    const dateMatch = firstLine.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
      const year = parseInt(dateMatch[3], 10);

      const date = new Date(year, month, day);

      // Validate the date is valid
      if (!isNaN(date.getTime()) && date.getDate() === day) {
        // Remove the date line from the text
        const remainingText = lines.slice(1).join('\n').trim();
        return { date, remainingText };
      }
    }

    return { date: null, remainingText: text };
  }

  /**
   * Import OCR text file: parse date from first line, clean text, create entry
   */
  importOcrText(rawText: string): { success: boolean; date: Date | null; error?: string } {
    // First clean the OCR text
    const cleanedText = this.cleanOcrText(rawText);

    // Parse date from first line
    const { date, remainingText } = this.parseDateFromText(cleanedText);

    if (!date) {
      return {
        success: false,
        date: null,
        error: 'Could not parse date from first line. Expected format: DD.MM.YYYY'
      };
    }

    if (!remainingText.trim()) {
      return {
        success: false,
        date: null,
        error: 'No text content found after date line'
      };
    }

    // Add the entry with the parsed date
    this.addEntryWithDate(remainingText, date);

    // Navigate to the entry's month
    this.currentDate.set(date);

    return { success: true, date };
  }

  deleteEntry(id: string) {
    this.entriesSignal.update(entries => entries.filter(e => e.id !== id));
  }

  deleteAllEntries() {
    this.entriesSignal.set([]);
  }

  updateEntry(id: string, text: string) {
    this.entriesSignal.update(entries =>
      entries.map(e => e.id === id ? { ...e, text, tags: this.extractTags(text) } : e)
    );
  }

  updateEntryDate(id: string, date: Date) {
    this.entriesSignal.update(entries =>
      entries.map(e => e.id === id ? { ...e, date } : e)
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
        date: new Date(e.date),
        tags: e.tags || this.extractTags(e.text),
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
      // Use local date for filename to avoid timezone shifts
      const year = entry.date.getFullYear();
      const month = String(entry.date.getMonth() + 1).padStart(2, '0');
      const day = String(entry.date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

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

  async importData(file: File): Promise<number> {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const newEntries: JournalEntry[] = [];

    // Iterate through files
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir || !filename.endsWith('.txt')) continue;

      // Handle paths in zip (e.g. if user zipped a folder)
      // Extract just the filename part
      const cleanFilename = filename.split('/').pop() || filename;

      // Parse date from filename (YYYY-MM-DD.txt)
      const dateStr = cleanFilename.replace('.txt', '');

      // Parse using local time components
      const parts = dateStr.split('-').map(Number);
      if (parts.length !== 3) continue;

      const [year, month, day] = parts;
      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) continue;

      const content = await zipEntry.async('string');

      if (!content || !content.trim()) continue;

      // Check if file contains multiple entries separated by '---'
      const entryTexts = content.split(/\n\n---\n\n/);

      for (const text of entryTexts) {
        if (!text.trim()) continue;

        newEntries.push({
          id: crypto.randomUUID(),
          date: date,
          text: text.trim(),
          tags: this.extractTags(text.trim())
        });
      }
    }

    if (newEntries.length > 0) {
      // Sort by date descending
      newEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Explicitly save to localStorage first to ensure persistence
      this.saveEntries(newEntries);

      // Then update the signal
      this.entriesSignal.set(newEntries);

      // Update view to the latest entry's month
      this.currentDate.set(newEntries[0].date);
    }

    return newEntries.length;
  }
}
