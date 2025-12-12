import { Injectable, signal } from '@angular/core';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from '../budget.models';

/**
 * BudgetDataService - Manages data signals and localStorage persistence
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetDataService {

    // Data signals
    transactions = signal<Transaction[]>([]);
    accounts = signal<Account[]>([]);
    categories = signal<Category[]>([]);
    fixedCosts = signal<FixedCost[]>([]);
    fixedCostGroups = signal<FixedCostGroup[]>([]);

    // Filter signals
    selectedAccountId = signal<string | null>(null);
    searchQuery = signal<string>('');
    selectedMonth = signal(new Date());

    // ==================== Data Loading ====================

    loadData() {
        const transactionsData = localStorage.getItem('mybudget_transactions');
        const accountsData = localStorage.getItem('mybudget_accounts');
        const categoriesData = localStorage.getItem('mybudget_categories');
        const fixedCostsData = localStorage.getItem('mybudget_fixedcosts');
        const fixedCostGroupsData = localStorage.getItem('mybudget_fixedcostgroups');

        if (transactionsData) this.transactions.set(JSON.parse(transactionsData));
        if (fixedCostGroupsData) this.fixedCostGroups.set(JSON.parse(fixedCostGroupsData));

        return {
            accountsData,
            categoriesData,
            fixedCostsData
        };
    }

    loadAccounts(parsedAccounts: Account[], needsSave: boolean) {
        this.accounts.set(parsedAccounts);
        if (needsSave) {
            this.saveAccounts();
        }
    }

    loadCategories(parsedCategories: Category[], needsSave: boolean) {
        this.categories.set(parsedCategories);
        if (needsSave) {
            this.saveCategories();
        }
    }

    loadFixedCosts(parsedFixedCosts: FixedCost[], needsSave: boolean) {
        this.fixedCosts.set(parsedFixedCosts);
        if (needsSave) {
            this.saveFixedCosts();
        }
    }

    // ==================== Data Saving ====================

    saveTransactions() {
        localStorage.setItem('mybudget_transactions', JSON.stringify(this.transactions()));
    }

    saveAccounts() {
        localStorage.setItem('mybudget_accounts', JSON.stringify(this.accounts()));
    }

    saveCategories() {
        localStorage.setItem('mybudget_categories', JSON.stringify(this.categories()));
    }

    saveFixedCosts() {
        localStorage.setItem('mybudget_fixedcosts', JSON.stringify(this.fixedCosts()));
    }

    saveFixedCostGroups() {
        localStorage.setItem('mybudget_fixedcostgroups', JSON.stringify(this.fixedCostGroups()));
    }

    // ==================== Lookups ====================

    getCategoryById(id: string): Category | undefined {
        return this.categories().find(c => c.id === id);
    }

    getCategoryFullName(id: string): string {
        const category = this.getCategoryById(id);
        if (!category) return 'Unbekannt';
        return category.name;
    }

    getSortedCategories(): Category[] {
        return [...this.categories()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }

    getAccountById(id: string): Account | undefined {
        return this.accounts().find(a => a.id === id);
    }

    getTotalBalance(): number {
        return this.accounts().reduce((sum, a) => sum + a.balance, 0);
    }
}
