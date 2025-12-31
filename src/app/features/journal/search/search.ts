import { Component, inject, effect } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
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
  private searchSubject = new Subject<string>();

  constructor() {
    effect(() => {
      this.query = this.journal.searchQuery();
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.journal.setSearchQuery(query);
    });
  }

  get isTagFilter(): boolean {
    return this.query.startsWith('#');
  }

  onSearch() {
    this.searchSubject.next(this.query);
  }

  clearSearch() {
    this.query = '';
    this.journal.clearSearch();
  }
}
