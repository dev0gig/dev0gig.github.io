import { Injectable, inject } from '@angular/core';
import { Transaction } from './budget.models';
import { BudgetStateService } from './budget.state.service';
import { BudgetUtilityService } from './budget.utility.service';

/**
 * BudgetStatsService - Calculates all statistics and chart data
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetStatsService {

    private stateService = inject(BudgetStateService);
    private utilityService = inject(BudgetUtilityService);

    // Expose Math for template
    Math = Math;

    /**
     * Get balance, income, and expenses based on selected month/account
     */
    getStats() {
        const currentMonth = this.stateService.selectedMonth().getMonth();
        const currentYear = this.stateService.selectedMonth().getFullYear();

        // 1. Calculate Balance (Account Filter Only)
        let balance = 0;
        if (this.stateService.selectedAccountId()) {
            const account = this.stateService.accounts().find(a => a.id === this.stateService.selectedAccountId());
            balance = account ? account.balance : 0;
        } else {
            balance = this.stateService.accounts().reduce((sum, a) => sum + a.balance, 0);
        }

        // 2. Calculate Income/Expenses (Account + Search + Month)
        let transactionsForStats = this.stateService.transactions();

        // Filter by Account
        if (this.stateService.selectedAccountId()) {
            transactionsForStats = transactionsForStats.filter(t =>
                t.account === this.stateService.selectedAccountId() ||
                (t.type === 'transfer' && t.toAccount === this.stateService.selectedAccountId())
            );
        }

        // Filter by Search
        const query = this.stateService.searchQuery().toLowerCase();
        if (query) {
            transactionsForStats = transactionsForStats.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.amount.toString().includes(query) ||
                this.stateService.getCategoryFullName(t.category).toLowerCase().includes(query)
            );
        }

        // Filter by Month
        const thisMonthTransactions = transactionsForStats.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const income = thisMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = thisMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { balance, income, expenses };
    }

    /**
     * Get expense breakdown by category
     */
    getCategoryStats() {
        const transactions = this.stateService.getSortedTransactions().filter(t => t.type === 'expense');
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        const stats = new Map<string, number>();
        transactions.forEach(t => {
            const current = stats.get(t.category) || 0;
            stats.set(t.category, current + t.amount);
        });

        return Array.from(stats.entries())
            .map(([id, amount]) => ({
                name: this.stateService.getCategoryFullName(id),
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: this.utilityService.getCategoryColor(id)
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    /**
     * Get income breakdown by category
     */
    getIncomeCategoryStats() {
        const transactions = this.stateService.getSortedTransactions().filter(t => t.type === 'income');
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        const stats = new Map<string, number>();
        transactions.forEach(t => {
            const current = stats.get(t.category) || 0;
            stats.set(t.category, current + t.amount);
        });

        return Array.from(stats.entries())
            .map(([id, amount]) => ({
                name: this.stateService.getCategoryFullName(id),
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: this.utilityService.getCategoryColor(id)
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    /**
     * Get daily trend data for the selected month
     */
    getDailyTrend() {
        const transactions = this.stateService.getSortedTransactions();
        const daysInMonth = new Date(
            this.stateService.selectedMonth().getFullYear(),
            this.stateService.selectedMonth().getMonth() + 1,
            0
        ).getDate();
        const dailyBalances: { day: number, balance: number, income: number, expense: number }[] = [];

        let currentBalance = 0;
        const transactionsByDay = new Map<number, Transaction[]>();

        transactions.forEach(t => {
            const day = new Date(t.date).getDate();
            const list = transactionsByDay.get(day) || [];
            list.push(t);
            transactionsByDay.set(day, list);
        });

        for (let i = 1; i <= daysInMonth; i++) {
            const dayTransactions = transactionsByDay.get(i) || [];
            let dayIncome = 0;
            let dayExpense = 0;

            dayTransactions.forEach(t => {
                if (t.type === 'income') {
                    dayIncome += t.amount;
                    currentBalance += t.amount;
                } else if (t.type === 'expense') {
                    dayExpense += t.amount;
                    currentBalance -= t.amount;
                } else if (t.type === 'transfer' && t.toAccount) {
                    if (this.stateService.selectedAccountId()) {
                        if (t.account === this.stateService.selectedAccountId()) {
                            currentBalance -= t.amount;
                        } else if (t.toAccount === this.stateService.selectedAccountId()) {
                            currentBalance += t.amount;
                        }
                    }
                }
            });

            dailyBalances.push({
                day: i,
                balance: currentBalance,
                income: dayIncome,
                expense: dayExpense
            });
        }

        return dailyBalances;
    }

    /**
     * Generate CSS conic gradient for expense pie chart
     */
    getPieChartGradient(): string {
        const stats = this.getCategoryStats();
        if (stats.length === 0) return 'conic-gradient(#333 0% 100%)';

        let gradient = 'conic-gradient(';
        let currentPercent = 0;

        stats.forEach((stat, index) => {
            const nextPercent = currentPercent + stat.percentage;
            gradient += `${stat.color} ${currentPercent}% ${nextPercent}%${index < stats.length - 1 ? ', ' : ''}`;
            currentPercent = nextPercent;
        });

        gradient += ')';
        return gradient;
    }

    /**
     * Generate CSS conic gradient for income pie chart
     */
    getIncomePieChartGradient(): string {
        const stats = this.getIncomeCategoryStats();
        if (stats.length === 0) return 'conic-gradient(#333 0% 100%)';

        let gradient = 'conic-gradient(';
        let currentPercent = 0;

        stats.forEach((stat, index) => {
            const nextPercent = currentPercent + stat.percentage;
            gradient += `${stat.color} ${currentPercent}% ${nextPercent}%${index < stats.length - 1 ? ', ' : ''}`;
            currentPercent = nextPercent;
        });

        gradient += ')';
        return gradient;
    }

    /**
     * Generate SVG polyline points for trend chart
     */
    getTrendPoints(): string {
        const data = this.getDailyTrend();
        if (data.length === 0) return '';

        const maxBalance = Math.max(...data.map(d => d.balance), 100);
        const minBalance = Math.min(...data.map(d => d.balance), 0);
        const range = maxBalance - minBalance || 1;

        const width = 100;
        const height = 50;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const normalizedBalance = (d.balance - minBalance) / range;
            const y = height - (normalizedBalance * height);
            return `${x},${y}`;
        }).join(' ');

        return points;
    }

    /**
     * Generate SVG polygon points for trend area fill
     */
    getTrendAreaPoints(): string {
        const data = this.getDailyTrend();
        if (data.length === 0) return '';

        const maxBalance = this.getTrendMaxValue();
        const minBalance = this.getTrendMinValue();
        const range = maxBalance - minBalance || 1;

        const width = 100;
        const height = 50;

        let points = `0,${height} `;
        data.forEach((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const normalizedBalance = (d.balance - minBalance) / range;
            const y = height - (normalizedBalance * height);
            points += `${x},${y} `;
        });
        points += `${width},${height}`;

        return points;
    }

    /**
     * Get max value for trend chart Y-axis
     */
    getTrendMaxValue(): number {
        const data = this.getDailyTrend();
        if (data.length === 0) return 100;
        return Math.max(...data.map(d => d.balance), 100);
    }

    /**
     * Get min value for trend chart Y-axis
     */
    getTrendMinValue(): number {
        const data = this.getDailyTrend();
        if (data.length === 0) return 0;
        return Math.min(...data.map(d => d.balance), 0);
    }

    /**
     * Get Y coordinate for zero line in trend chart
     */
    getZeroLineY(): number {
        const max = this.getTrendMaxValue();
        const min = this.getTrendMinValue();
        const range = max - min || 1;
        const height = 50;
        return height - ((0 - min) / range) * height;
    }

    /**
     * Get number of days in selected month
     */
    getDaysInSelectedMonth(): number {
        return new Date(
            this.stateService.selectedMonth().getFullYear(),
            this.stateService.selectedMonth().getMonth() + 1,
            0
        ).getDate();
    }

    /**
     * Get selected month name in German
     */
    getSelectedMonthName(): string {
        return this.stateService.selectedMonth().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }

    /**
     * Get count of income transactions in selected month
     */
    getIncomeTransactionCount(): number {
        return this.stateService.getSortedTransactions().filter(t => t.type === 'income').length;
    }

    /**
     * Get count of expense transactions in selected month
     */
    getExpenseTransactionCount(): number {
        return this.stateService.getSortedTransactions().filter(t => t.type === 'expense').length;
    }

    /**
     * Get top 10 expenses in selected month
     */
    getTopExpenses(): Transaction[] {
        return this.stateService.getSortedTransactions()
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);
    }

    /**
     * Get average daily expense for selected month
     */
    getAverageDailyExpense(): number {
        const expenses = this.getStats().expenses;
        const daysInMonth = this.getDaysInSelectedMonth();
        return expenses / daysInMonth;
    }

    /**
     * Get average daily income for selected month
     */
    getAverageDailyIncome(): number {
        const income = this.getStats().income;
        const daysInMonth = this.getDaysInSelectedMonth();
        return income / daysInMonth;
    }

    /**
     * Get largest expense in selected month
     */
    getLargestExpense(): number {
        const expenses = this.stateService.getSortedTransactions().filter(t => t.type === 'expense');
        if (expenses.length === 0) return 0;
        return Math.max(...expenses.map(t => t.amount));
    }

    /**
     * Get largest income in selected month
     */
    getLargestIncome(): number {
        const incomes = this.stateService.getSortedTransactions().filter(t => t.type === 'income');
        if (incomes.length === 0) return 0;
        return Math.max(...incomes.map(t => t.amount));
    }
}
