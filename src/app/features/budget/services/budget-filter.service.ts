import { Injectable, inject } from '@angular/core';
import { Transaction } from '../budget.models';
import { BudgetDataService } from './budget-data.service';

/**
 * BudgetFilterService - Manages filtering and search operations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetFilterService {

    private dataService = inject(BudgetDataService);

    // ==================== Search & Filter ====================

    onSearch(query: string) {
        console.log('[FilterService] onSearch called with query:', query);
        this.dataService.searchQuery.set(query);
        console.log('[FilterService] searchQuery signal updated to:', this.dataService.searchQuery());
    }

    onMonthChange(date: Date) {
        this.dataService.selectedMonth.set(date);
    }

    getFilteredTransactions(): Transaction[] {
        console.log('[FilterService] getFilteredTransactions called');
        console.log('[FilterService] Current searchQuery:', this.dataService.searchQuery());
        console.log('[FilterService] Total transactions:', this.dataService.transactions().length);
        let filtered = this.dataService.transactions();

        // Filter by Account
        if (this.dataService.selectedAccountId()) {
            filtered = filtered.filter(t =>
                t.account === this.dataService.selectedAccountId() ||
                (t.type === 'transfer' && t.toAccount === this.dataService.selectedAccountId())
            );
        }

        // Filter by Search
        const query = this.dataService.searchQuery().toLowerCase();
        if (query) {
            console.log('[FilterService] Filtering with query:', query);
            filtered = filtered.filter(t => {
                // Search in title/description (with null check)
                if (t.description && t.description.toLowerCase().includes(query)) return true;

                // Search in amount (as string, with null check)
                if (t.amount != null && t.amount.toString().includes(query)) return true;

                // Search in formatted amount (with comma for German locale)
                if (t.amount != null && t.amount.toFixed(2).replace('.', ',').includes(query)) return true;

                // Search in category name
                const categoryName = this.dataService.getCategoryFullName(t.category);
                if (categoryName && categoryName.toLowerCase().includes(query)) return true;

                // Search in account name
                const account = this.dataService.getAccountById(t.account);
                if (account && account.name && account.name.toLowerCase().includes(query)) return true;

                // Search in date (multiple formats)
                if (t.date) {
                    const date = new Date(t.date);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear().toString();
                    const yearShort = year.slice(-2);

                    // Match formats: DD.MM.YYYY, DD.MM.YY, YYYY-MM-DD, DD/MM/YYYY
                    const dateFormats = [
                        `${day}.${month}.${year}`,      // 12.12.2025
                        `${day}.${month}.${yearShort}`, // 12.12.25
                        t.date,                          // 2025-12-12 (original)
                        `${day}/${month}/${year}`,       // 12/12/2025
                    ];

                    if (dateFormats.some(format => format.includes(query))) return true;
                }

                return false;
            });
            console.log('[FilterService] Filtered to', filtered.length, 'transactions');
        }
        return filtered;
    }

    getSortedTransactions(): Transaction[] {
        let filtered = this.getFilteredTransactions();

        // Filter by Month
        const currentMonth = this.dataService.selectedMonth().getMonth();
        const currentYear = this.dataService.selectedMonth().getFullYear();

        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        return filtered.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
}
