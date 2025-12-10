import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction, Account } from '../../budget.models';
import { BudgetUtilityService } from '../../budget.utility.service';
import { BudgetCalendar } from '../../calendar/calendar';

interface Stats {
    balance: number;
    income: number;
    expenses: number;
}

@Component({
    selector: 'app-budget-sidebar',
    standalone: true,
    imports: [CommonModule, BudgetCalendar],
    templateUrl: './budget-sidebar.html'
})
export class BudgetSidebarComponent {
    private utilityService = inject(BudgetUtilityService);

    @Input() stats: Stats = { balance: 0, income: 0, expenses: 0 };
    @Input() accounts: Account[] = [];
    @Input() transactions: Transaction[] = [];
    @Input() selectedAccountId: string | null = null;
    @Input() totalBalance = 0;

    @Output() selectAccount = new EventEmitter<string | null>();
    @Output() monthChange = new EventEmitter<Date>();

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    onSelectAccount(id: string | null): void {
        this.selectAccount.emit(id);
    }

    onMonthChange(date: Date): void {
        this.monthChange.emit(date);
    }
}
