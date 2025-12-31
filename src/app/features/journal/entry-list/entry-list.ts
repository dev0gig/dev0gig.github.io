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

    // When duplicate filter or global search is active, show all entries (already filtered by service)
    if (this.journal.duplicateFilter() || this.journal.isGlobalSearchActive()) {
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
    if (input.value) {
      const newDate = new Date(input.value);
      if (!isNaN(newDate.getTime())) {
        this.journal.updateEntryDate(entry.id, newDate);
      }
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

  // Parse text into segments with highlighted tags
  parseTextWithTags(text: string): { type: 'text' | 'tag', content: string }[] {
    const segments: { type: 'text' | 'tag', content: string }[] = [];
    const regex = /#(\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the tag
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      // Add the tag
      segments.push({ type: 'tag', content: match[1] });
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({ type: 'text', content: text.slice(lastIndex) });
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
