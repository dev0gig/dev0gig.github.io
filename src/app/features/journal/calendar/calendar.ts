import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JournalService } from '../journal';
import { SharedCalendarComponent } from '../../../shared/components/calendar/calendar.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, SharedCalendarComponent],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar {
  private journal = inject(JournalService);
  currentDate = this.journal.currentDate;

  markers = computed(() => {
    return this.journal.entries().map(e => e.date);
  });

  onViewDateChange(date: Date) {
    this.journal.setCurrentDate(date);
  }
}
