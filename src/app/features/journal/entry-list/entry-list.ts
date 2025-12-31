import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalService } from '../journal';
import { Search } from '../search/search';

@Component({
  selector: 'app-entry-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entry-list.html',
  styleUrl: './entry-list.css'
})
export class EntryList {
  protected journal = inject(JournalService);

  // Filtered entries for current month (or all when duplicate/search filter is active)
  filteredEntries = computed(() => {
    const current = this.journal.currentDate();
    const entries = this.journal.displayEntries();

    // When global search is active, show all entries (already filtered by service)
    if (this.journal.isGlobalSearchActive()) {
      return entries;
    }

    return entries.filter(e =>
      e.date.getMonth() === current.getMonth() &&
      e.date.getFullYear() === current.getFullYear()
    );
  });

  newEntryText = '';

  // Editing state
  editingEntryId: string | null = null;
  editEntryText = '';
  editingHeight: number = 0;

  // Date editing state
  editingDateId: string | null = null;

  getIsoDate(date: Date): string {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  }

  startEditingDate(entry: any) {
    this.editingDateId = entry.id;
  }

  cancelDateEdit() {
    this.editingDateId = null;
  }

  saveDateEdit(entry: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const newDate = new Date(input.value);
    if (!isNaN(newDate.getTime())) {
      // Preserve original time
      const originalDate = new Date(entry.date);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());
      newDate.setSeconds(originalDate.getSeconds());
      this.journal.updateEntryDate(entry.id, newDate);
    }
    this.editingDateId = null;
  }

  addEntry() {
    if (this.newEntryText.trim()) {
      this.journal.addEntry(this.newEntryText);
      this.newEntryText = '';
      // Only reset to current month if we're not already viewing the current month
      const now = new Date();
      const current = this.journal.currentDate();
      if (current.getMonth() !== now.getMonth() || current.getFullYear() !== now.getFullYear()) {
        this.journal.setCurrentDate(now);
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.addEntry();
    }
  }

  // Edit mode methods
  startEditing(entry: any, event: MouseEvent) {
    // Get the actual height of the clicked text element
    const textElement = event.currentTarget as HTMLElement;
    this.editingHeight = textElement.offsetHeight;
    this.editingEntryId = entry.id;
    this.editEntryText = entry.text;
  }

  saveEdit() {
    if (this.editingEntryId) {
      // Only update if text is not empty
      if (this.editEntryText.trim()) {
        this.journal.updateEntry(this.editingEntryId, this.editEntryText);
      }
      // Always exit edit mode
      this.editingEntryId = null;
      this.editEntryText = '';
    }
  }

  deleteEntry(id: string) {
    if (confirm('Are you sure you want to delete this entry?')) {
      this.journal.deleteEntry(id);
    }
  }

  // Parse text into segments with highlighted tags and search matches
  parseTextWithTags(text: string): { type: 'text' | 'tag' | 'highlight', content: string }[] {
    const segments: { type: 'text' | 'tag' | 'highlight', content: string }[] = [];
    const searchQuery = this.journal.searchQuery().trim().toLowerCase();

    // First pass: split by tags
    const tagRegex = /#([a-zA-Z0-9_äöüßÄÖÜ]+)/g;
    let lastIndex = 0;
    let match;
    const tagSegments: { type: 'text' | 'tag', content: string }[] = [];

    while ((match = tagRegex.exec(text)) !== null) {
      // Add text before the tag
      if (match.index > lastIndex) {
        tagSegments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      // Add the tag
      tagSegments.push({ type: 'tag', content: match[1] });
      lastIndex = tagRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      tagSegments.push({ type: 'text', content: text.slice(lastIndex) });
    }

    // Second pass: highlight search query in text segments
    if (searchQuery && !searchQuery.startsWith('#')) {
      for (const segment of tagSegments) {
        if (segment.type === 'text') {
          // Split text by search query (case-insensitive)
          const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const highlightRegex = new RegExp(`(${escapedQuery})`, 'gi');
          const parts = segment.content.split(highlightRegex);

          for (const part of parts) {
            if (part.toLowerCase() === searchQuery) {
              segments.push({ type: 'highlight', content: part });
            } else if (part) {
              segments.push({ type: 'text', content: part });
            }
          }
        } else {
          segments.push(segment);
        }
      }
    } else {
      segments.push(...tagSegments);
    }

    return segments;
  }

  // Store colors for consistent tag coloring
  private tagColors = new Map<string, string>();

  getTagColor(tag: string): string {
    if (this.tagColors.has(tag)) {
      return this.tagColors.get(tag)!;
    }

    const pastelColors = [
      'hsl(340, 70%, 85%)',
      'hsl(210, 70%, 85%)',
      'hsl(120, 50%, 80%)',
      'hsl(45, 80%, 85%)',
      'hsl(280, 60%, 85%)',
      'hsl(180, 60%, 80%)',
      'hsl(30, 80%, 85%)',
      'hsl(0, 70%, 85%)',
    ];

    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = ((hash << 5) - hash) + tag.charCodeAt(i);
      hash |= 0;
    }

    const color = pastelColors[Math.abs(hash) % pastelColors.length];
    this.tagColors.set(tag, color);
    return color;
  }

  onTagClick(tag: string, event: MouseEvent) {
    event.stopPropagation(); // Prevent triggering edit mode
    this.journal.searchByTag(tag);
  }

}
