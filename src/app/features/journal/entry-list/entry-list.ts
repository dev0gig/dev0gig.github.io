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

  // Filtered entries for current month
  filteredEntries = computed(() => {
    const current = this.journal.currentDate();
    const entries = this.journal.displayEntries();

    return entries.filter(e =>
      e.date.getMonth() === current.getMonth() &&
      e.date.getFullYear() === current.getFullYear()
    );
  });

  newEntryText = '';

  // Editing state
  editingEntryId: string | null = null;
  editEntryText = '';

  addEntry() {
    if (this.newEntryText.trim()) {
      this.journal.addEntry(this.newEntryText);
      this.newEntryText = '';
      // Reset to current month to see the new entry
      this.journal.setCurrentDate(new Date());
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.addEntry();
    }
  }

  // Edit mode methods
  startEditing(entry: any) {
    this.editingEntryId = entry.id;
    this.editEntryText = entry.text;
  }

  saveEdit() {
    if (this.editingEntryId && this.editEntryText.trim()) {
      this.journal.updateEntry(this.editingEntryId, this.editEntryText);
      this.editingEntryId = null;
      this.editEntryText = '';
    }
  }

  cancelEdit() {
    this.editingEntryId = null;
    this.editEntryText = '';
  }

  onEditKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  deleteEntry(id: string) {
    if (confirm('Are you sure you want to delete this entry?')) {
      this.journal.deleteEntry(id);
    }
  }
}
