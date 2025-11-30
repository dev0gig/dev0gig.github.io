import { Component, Input, Output, EventEmitter, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-budget-calendar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar.html',
    styleUrl: './calendar.css'
})
export class BudgetCalendar implements OnChanges {
    @Input() transactions: any[] = [];
    @Output() monthChange = new EventEmitter<Date>();

    currentDate = signal(new Date());

    ngOnChanges(changes: SimpleChanges) {
        // If transactions change, the computed 'days' will automatically update
    }

    days = computed(() => {
        const date = this.currentDate();
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday

        // Adjust for Monday start (ISO 8601)
        const startOffset = startingDay === 0 ? 6 : startingDay - 1;

        const days: { type: 'day' | 'week', value: any, hasEntry?: boolean, isToday?: boolean }[] = [];

        // Helper to get ISO week number
        const getWeek = (d: Date) => {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        let currentWeekDays = 0;

        // Add first week number
        const gridStartDate = new Date(year, month, 1 - startOffset);
        days.push({ type: 'week', value: getWeek(gridStartDate) });

        // Padding
        for (let i = 0; i < startOffset; i++) {
            days.push({ type: 'day', value: null, hasEntry: false, isToday: false });
            currentWeekDays++;
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            if (currentWeekDays === 7) {
                currentWeekDays = 0;
                const currentDayDate = new Date(year, month, i);
                days.push({ type: 'week', value: getWeek(currentDayDate) });
            }

            const d = new Date(year, month, i);
            const hasEntry = this.hasTransactionOnDate(d);
            const isToday = this.isSameDay(d, new Date());
            days.push({ type: 'day', value: d, hasEntry, isToday });
            currentWeekDays++;
        }

        // Fill remaining cells
        while (currentWeekDays < 7) {
            days.push({ type: 'day', value: null, hasEntry: false, isToday: false });
            currentWeekDays++;
        }

        return days;
    });

    monthName = computed(() => {
        return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
    });

    prevMonth() {
        const newDate = new Date(this.currentDate());
        newDate.setMonth(newDate.getMonth() - 1);
        this.currentDate.set(newDate);
        this.monthChange.emit(newDate);
    }

    nextMonth() {
        const newDate = new Date(this.currentDate());
        newDate.setMonth(newDate.getMonth() + 1);
        this.currentDate.set(newDate);
        this.monthChange.emit(newDate);
    }

    private hasTransactionOnDate(date: Date): boolean {
        return this.transactions.some(t => {
            const tDate = new Date(t.date);
            return this.isSameDay(tDate, date);
        });
    }

    private isSameDay(d1: Date, d2: Date): boolean {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }
}
