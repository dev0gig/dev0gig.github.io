import { Component, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JournalService } from '../journal';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search {
  journal = inject(JournalService);
  query = '';

  constructor() {
    effect(() => {
      this.query = this.journal.searchQuery();
    });
  }

  get isTagFilter(): boolean {
    return this.query.startsWith('#');
  }

  onSearch() {
    this.journal.setSearchQuery(this.query);
  }

  clearSearch() {
    this.query = '';
    this.journal.clearSearch();
  }
}
