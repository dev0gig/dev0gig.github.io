import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedCalendarComponent } from '../../../shared/components/calendar/calendar.component';

@Component({
    selector: 'app-budget-calendar',
    standalone: true,
    imports: [CommonModule, SharedCalendarComponent],
    templateUrl: './calendar.html',
    styleUrl: './calendar.css'
})
export class BudgetCalendar {
    transactions = input<any[]>([]);
    monthChange = output<Date>();

    currentDate = signal(new Date());

    markers = computed(() => {
        return this.transactions().map(t => new Date(t.date));
    });

    onViewDateChange(date: Date) {
        this.currentDate.set(date);
        this.monthChange.emit(date);
    }
}
