import { Component, Input, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Transaction } from '../../budget.models';
import { BudgetUtilityService } from '../../budget.utility.service';
import { ThemeService } from '../../../../shared/theme.service';

interface CategoryStat {
    name: string;
    amount: number;
    percentage: number;
    color: string;
}

interface DailyTrend {
    day: number;
    income: number;
    expense: number;
    balance: number;
}

interface Stats {
    balance: number;
    income: number;
    expenses: number;
}

@Component({
    selector: 'app-statistics-view',
    standalone: true,
    imports: [CommonModule, DecimalPipe],
    templateUrl: './statistics-view.html'
})
export class StatisticsViewComponent {
    private utilityService = inject(BudgetUtilityService);
    themeService = inject(ThemeService);
    Math = Math;

    @Input() stats: Stats = { balance: 0, income: 0, expenses: 0 };
    @Input() categoryStats: CategoryStat[] = [];
    @Input() incomeCategoryStats: CategoryStat[] = [];
    @Input() dailyTrend: DailyTrend[] = [];
    @Input() topExpenses: Transaction[] = [];
    @Input() selectedMonthName = '';
    @Input() selectedAccountName: string | null = null;
    @Input() transactionCount = 0;
    @Input() incomeTransactionCount = 0;
    @Input() expenseTransactionCount = 0;
    @Input() averageDailyExpense = 0;
    @Input() averageDailyIncome = 0;
    @Input() largestExpense = 0;
    @Input() largestIncome = 0;
    @Input() pieChartGradient = '';
    @Input() incomePieChartGradient = '';
    @Input() trendPoints = '';
    @Input() trendAreaPoints = '';
    @Input() trendMaxValue = 0;
    @Input() trendMinValue = 0;
    @Input() zeroLineY = 30;
    @Input() daysInSelectedMonth = 30;

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    formatDate(dateStr: string): string {
        return this.utilityService.formatDate(dateStr);
    }

    getCategoryFullName(id: string): string {
        // Will be passed via input or calculated externally
        return id;
    }
}
