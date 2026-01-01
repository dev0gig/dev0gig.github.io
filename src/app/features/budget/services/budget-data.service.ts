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

    loadData() {
        const transactionsData = localStorage.getItem(STORAGE_KEYS.BUDGET.TRANSACTIONS);
        const accountsData = localStorage.getItem(STORAGE_KEYS.BUDGET.ACCOUNTS);
        const categoriesData = localStorage.getItem(STORAGE_KEYS.BUDGET.CATEGORIES);
        const fixedCostsData = localStorage.getItem(STORAGE_KEYS.BUDGET.FIXED_COSTS);
        const fixedCostGroupsData = localStorage.getItem(STORAGE_KEYS.BUDGET.FIXED_COST_GROUPS);

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
