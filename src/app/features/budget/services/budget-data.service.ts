import { Injectable, signal } from '@angular/core';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from '../budget.models';
import { STORAGE_KEYS } from '../../../core/storage-keys.const';

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

    /**
     * Loads and parses all budget data from localStorage.
     * Returns parsed and validated arrays ready for use.
     */
    loadAndParseData(): { accounts: Account[]; categories: Category[] | null; fixedCosts: FixedCost[] } {
        // Load and set transactions directly
        const transactionsData = localStorage.getItem(STORAGE_KEYS.BUDGET.TRANSACTIONS);
        if (transactionsData) {
            this.transactions.set(JSON.parse(transactionsData));
        }

        // Load and set fixed cost groups directly
        const fixedCostGroupsData = localStorage.getItem(STORAGE_KEYS.BUDGET.FIXED_COST_GROUPS);
        if (fixedCostGroupsData) {
            this.fixedCostGroups.set(JSON.parse(fixedCostGroupsData));
        }

        // Parse and validate accounts
        const accounts = this.parseAccounts();

        // Parse and validate categories (null if no data exists)
        const categories = this.parseCategories();

        // Parse, validate, and migrate fixed costs
        const fixedCosts = this.parseFixedCosts();

        return { accounts, categories, fixedCosts };
    }

    private parseAccounts(): Account[] {
        const accountsData = localStorage.getItem(STORAGE_KEYS.BUDGET.ACCOUNTS);
        if (!accountsData) return [];

        let parsedAccounts: Account[] = JSON.parse(accountsData);
        const originalCount = parsedAccounts.length;
        parsedAccounts = parsedAccounts.filter(a =>
            a.name && a.name.trim() !== '' &&
            !isNaN(a.balance) && a.balance !== null && a.balance !== undefined
        );
        const removedCount = originalCount - parsedAccounts.length;
        if (removedCount > 0) {
            console.warn(`loadData: Removed ${removedCount} invalid account entries`);
        }

        this.accounts.set(parsedAccounts);
        if (removedCount > 0) {
            this.saveAccounts();
        }
        return parsedAccounts;
    }

    private parseCategories(): Category[] | null {
        const categoriesData = localStorage.getItem(STORAGE_KEYS.BUDGET.CATEGORIES);
        if (!categoriesData) return null;

        let parsedCategories: Category[] = JSON.parse(categoriesData);
        const originalCount = parsedCategories.length;
        parsedCategories = parsedCategories.filter(c =>
            c.name && typeof c.name === 'string' && c.name.trim() !== '' &&
            ['income', 'expense', 'both'].includes(c.type)
        );
        const removedCount = originalCount - parsedCategories.length;
        if (removedCount > 0) {
            console.warn(`loadData: Removed ${removedCount} invalid/corrupted category entries`);
        }

        this.categories.set(parsedCategories);
        if (removedCount > 0) {
            this.saveCategories();
        }
        return parsedCategories;
    }

    private parseFixedCosts(): FixedCost[] {
        const fixedCostsData = localStorage.getItem(STORAGE_KEYS.BUDGET.FIXED_COSTS);
        if (!fixedCostsData) return [];

        let parsedFixedCosts: FixedCost[] = JSON.parse(fixedCostsData);
        const originalCount = parsedFixedCosts.length;
        parsedFixedCosts = parsedFixedCosts.filter(fc =>
            fc.name && fc.name.trim() !== '' &&
            !isNaN(fc.amount) && fc.amount !== null && fc.amount !== undefined &&
            fc.category && fc.account
        );
        const removedCount = originalCount - parsedFixedCosts.length;
        if (removedCount > 0) {
            console.warn(`loadData: Removed ${removedCount} invalid fixed cost entries`);
        }

        // Migration: Add order field if missing
        let needsMigration = false;
        parsedFixedCosts = parsedFixedCosts.map((fc, index) => {
            if (fc.order === undefined) {
                needsMigration = true;
                return { ...fc, order: index };
            }
            return fc;
        });

        this.fixedCosts.set(parsedFixedCosts);
        if (needsMigration || removedCount > 0) {
            this.saveFixedCosts();
        }
        return parsedFixedCosts;
    }

    // ==================== Data Saving ====================

    saveTransactions() {
        localStorage.setItem(STORAGE_KEYS.BUDGET.TRANSACTIONS, JSON.stringify(this.transactions()));
    }

    saveAccounts() {
        localStorage.setItem(STORAGE_KEYS.BUDGET.ACCOUNTS, JSON.stringify(this.accounts()));
    }

    saveCategories() {
        localStorage.setItem(STORAGE_KEYS.BUDGET.CATEGORIES, JSON.stringify(this.categories()));
    }

    saveFixedCosts() {
        localStorage.setItem(STORAGE_KEYS.BUDGET.FIXED_COSTS, JSON.stringify(this.fixedCosts()));
    }

    saveFixedCostGroups() {
        localStorage.setItem(STORAGE_KEYS.BUDGET.FIXED_COST_GROUPS, JSON.stringify(this.fixedCostGroups()));
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

    // ==================== Backup Export/Import ====================

    /**
     * Returns all budget data for backup export (used by BackupService)
     */
    getExportData(): { transactions: Transaction[]; accounts: Account[]; categories: Category[]; fixedCosts: FixedCost[]; fixedCostGroups: FixedCostGroup[] } {
        return {
            transactions: this.transactions(),
            accounts: this.accounts(),
            categories: this.categories(),
            fixedCosts: this.fixedCosts(),
            fixedCostGroups: this.fixedCostGroups()
        };
    }

    /**
     * Imports budget data from backup (used by BackupService)
     */
    importData(data: any): void {
        if (data.transactions) {
            this.transactions.set(data.transactions);
            this.saveTransactions();
        }
        if (data.accounts) {
            this.accounts.set(data.accounts);
            this.saveAccounts();
        }
        if (data.categories) {
            this.categories.set(data.categories);
            this.saveCategories();
        }
        if (data.fixedCosts) {
            this.fixedCosts.set(data.fixedCosts);
            this.saveFixedCosts();
        }
        if (data.fixedCostGroups) {
            this.fixedCostGroups.set(data.fixedCostGroups);
            this.saveFixedCostGroups();
        }
    }
}
