import { Injectable, inject } from '@angular/core';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from './budget.models';
import { BudgetUtilityService } from './budget.utility.service';
import {
    BudgetDataService,
    BudgetAccountService,
    BudgetCategoryService,
    BudgetTransactionService,
    BudgetFixedCostService,
    BudgetFilterService,
    BudgetImportExportService
} from './services';

/**
 * BudgetStateService - Facade that coordinates all budget sub-services
 * Maintains backwards compatibility with existing template bindings
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetStateService {

    private dataService = inject(BudgetDataService);
    private accountService = inject(BudgetAccountService);
    private categoryService = inject(BudgetCategoryService);
    private transactionService = inject(BudgetTransactionService);
    private fixedCostService = inject(BudgetFixedCostService);
    private filterService = inject(BudgetFilterService);
    private importExportService = inject(BudgetImportExportService);
    private utilityService = inject(BudgetUtilityService);

    // ==================== Data Signals (delegated to DataService) ====================

    get transactions() { return this.dataService.transactions; }
    get accounts() { return this.dataService.accounts; }
    get categories() { return this.dataService.categories; }
    get fixedCosts() { return this.dataService.fixedCosts; }
    get fixedCostGroups() { return this.dataService.fixedCostGroups; }
    get selectedAccountId() { return this.dataService.selectedAccountId; }
    get searchQuery() { return this.dataService.searchQuery; }
    get selectedMonth() { return this.dataService.selectedMonth; }

    constructor() {
        this.loadData();
    }

    // ==================== Data Loading/Saving ====================

    loadData() {
        const { accountsData, categoriesData, fixedCostsData } = this.dataService.loadData();

        // Process accounts
        if (accountsData) {
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
            this.dataService.loadAccounts(parsedAccounts, removedCount > 0);
        }

        // Process categories
        if (categoriesData) {
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
            this.dataService.loadCategories(parsedCategories, removedCount > 0);
        } else {
            this.addDefaultCategories();
        }

        // Process fixed costs
        if (fixedCostsData) {
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
            this.dataService.loadFixedCosts(parsedFixedCosts, needsMigration || removedCount > 0);
        }
    }

    saveTransactions() { this.dataService.saveTransactions(); }
    saveAccounts() { this.dataService.saveAccounts(); }
    saveCategories() { this.dataService.saveCategories(); }
    saveFixedCosts() { this.dataService.saveFixedCosts(); }
    saveFixedCostGroups() { this.dataService.saveFixedCostGroups(); }

    // ==================== Lookups ====================

    getCategoryById(id: string) { return this.dataService.getCategoryById(id); }
    getCategoryFullName(id: string) { return this.dataService.getCategoryFullName(id); }
    getSortedCategories() { return this.dataService.getSortedCategories(); }
    getAccountById(id: string) { return this.dataService.getAccountById(id); }
    getTotalBalance() { return this.dataService.getTotalBalance(); }

    // ==================== Account Operations ====================

    selectAccount(id: string | null) { this.accountService.selectAccount(id); }
    updateAccountBalance(accountId: string, delta: number) { this.accountService.updateAccountBalance(accountId, delta); }
    addAccount(name: string, balance: number) { this.accountService.addAccount(name, balance); }
    updateAccount(id: string, name: string, balance: number) { this.accountService.updateAccount(id, name, balance); }
    deleteAccount(id: string) { return this.accountService.deleteAccount(id); }

    // ==================== Category Operations ====================

    addCategory(name: string, type: 'income' | 'expense' | 'both') { this.categoryService.addCategory(name, type); }
    updateCategory(id: string, name: string, type: 'income' | 'expense' | 'both') { this.categoryService.updateCategory(id, name, type); }
    deleteCategory(id: string) { this.categoryService.deleteCategory(id); }
    deleteAllCategories() { this.categoryService.deleteAllCategories(); }
    deleteSelectedCategories(ids: string[]) { this.categoryService.deleteSelectedCategories(ids); }
    addDefaultCategories() { return this.categoryService.addDefaultCategories(); }
    getOrCreateCategory(categoryNameRaw: string, categoriesMap: Map<string, Category>) {
        return this.categoryService.getOrCreateCategory(categoryNameRaw, categoriesMap);
    }

    // ==================== Transaction Operations ====================

    revertTransactionBalance(t: Transaction) { this.transactionService.revertTransactionBalance(t); }
    applyTransactionBalance(t: Transaction) { this.transactionService.applyTransactionBalance(t); }
    addTransaction(transaction: Omit<Transaction, 'id'>) { return this.transactionService.addTransaction(transaction); }
    updateTransaction(id: string, transactionData: Omit<Transaction, 'id'>, oldTransaction: Transaction) {
        this.transactionService.updateTransaction(id, transactionData, oldTransaction);
    }
    deleteTransaction(id: string) { this.transactionService.deleteTransaction(id); }
    deleteAllTransactions() { this.transactionService.deleteAllTransactions(); }

    // ==================== Fixed Cost Operations ====================

    getFixedCosts() { return this.fixedCostService.getFixedCosts(); }
    getFixedCostsSortedByCategory() { return this.fixedCostService.getFixedCostsSortedByCategory(); }
    getFixedCostsTotal() { return this.fixedCostService.getFixedCostsTotal(); }
    getFixedIncomeTotal() { return this.fixedCostService.getFixedIncomeTotal(); }
    getFixedTransferTotal() { return this.fixedCostService.getFixedTransferTotal(); }
    getExcludedFixedCostsTotal() { return this.fixedCostService.getExcludedFixedCostsTotal(); }
    getFixedIncomeCount() { return this.fixedCostService.getFixedIncomeCount(); }
    getFixedExpenseCount() { return this.fixedCostService.getFixedExpenseCount(); }
    getFixedTransferCount() { return this.fixedCostService.getFixedTransferCount(); }
    getExcludedFixedCostsCount() { return this.fixedCostService.getExcludedFixedCostsCount(); }
    getFixedCostsSortedByOrder() { return this.fixedCostService.getFixedCostsSortedByOrder(); }
    getFixedCostGroupsSortedByOrder() { return this.fixedCostService.getFixedCostGroupsSortedByOrder(); }

    addFixedCost(data: {
        name: string;
        amount: number;
        type: 'income' | 'expense' | 'transfer';
        category: string;
        account: string;
        toAccount?: string;
        groupId?: string;
        note?: string;
        excludeFromTotal?: boolean;
    }) { this.fixedCostService.addFixedCost(data); }

    updateFixedCost(id: string, data: {
        name: string;
        amount: number;
        type: 'income' | 'expense' | 'transfer';
        category: string;
        account: string;
        toAccount?: string;
        groupId?: string;
        note?: string;
        excludeFromTotal?: boolean;
    }) { this.fixedCostService.updateFixedCost(id, data); }

    deleteFixedCost(id: string) { this.fixedCostService.deleteFixedCost(id); }
    copyTransactionToFixedCost(transaction: Transaction) { this.fixedCostService.copyTransactionToFixedCost(transaction); }
    reorderFixedCosts(fixedCostIds: string[]) { this.fixedCostService.reorderFixedCosts(fixedCostIds); }

    // ==================== Fixed Cost Group Operations ====================

    addFixedCostGroup(name: string) { return this.fixedCostService.addFixedCostGroup(name); }
    updateFixedCostGroup(id: string, name: string) { this.fixedCostService.updateFixedCostGroup(id, name); }
    deleteFixedCostGroup(id: string) { this.fixedCostService.deleteFixedCostGroup(id); }
    toggleFixedCostGroupCollapsed(id: string) { this.fixedCostService.toggleFixedCostGroupCollapsed(id); }
    reorderFixedCostGroups(groupIds: string[]) { this.fixedCostService.reorderFixedCostGroups(groupIds); }
    deleteAllFixedCostGroups() { this.fixedCostService.deleteAllFixedCostGroups(); }
    deleteSelectedFixedCostGroups(ids: string[]) { this.fixedCostService.deleteSelectedFixedCostGroups(ids); }

    // ==================== Filtering ====================

    onSearch(query: string) { this.filterService.onSearch(query); }
    onMonthChange(date: Date) { this.filterService.onMonthChange(date); }
    getFilteredTransactions() { return this.filterService.getFilteredTransactions(); }
    getSortedTransactions() { return this.filterService.getSortedTransactions(); }

    // ==================== Import/Export ====================

    importExtendedFormat(data: { transaktionen: any[], fixkosten: any[] }) {
        return this.importExportService.importExtendedFormat(data);
    }
    importLegacyFormat(jsonData: any[]) { return this.importExportService.importLegacyFormat(jsonData); }
    importTransactionsFromCSV(transactions: Transaction[]) { return this.importExportService.importTransactionsFromCSV(transactions); }
    getExportData() { return this.importExportService.getExportData(); }
}
