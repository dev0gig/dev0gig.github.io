import { Injectable, signal } from '@angular/core';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from './budget.models';
import { BudgetUtilityService } from './budget.utility.service';

/**
 * BudgetStateService - Manages all data signals and CRUD operations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetStateService {

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

    constructor(private utilityService: BudgetUtilityService) {
        this.loadData();
    }

    // ==================== Data Loading/Saving ====================

    loadData() {
        const transactionsData = localStorage.getItem('mybudget_transactions');
        const accountsData = localStorage.getItem('mybudget_accounts');
        const categoriesData = localStorage.getItem('mybudget_categories');
        const fixedCostsData = localStorage.getItem('mybudget_fixedcosts');
        const fixedCostGroupsData = localStorage.getItem('mybudget_fixedcostgroups');

        if (transactionsData) this.transactions.set(JSON.parse(transactionsData));
        if (accountsData) {
            let parsedAccounts: Account[] = JSON.parse(accountsData);

            // Filter out invalid accounts (missing name or invalid balance)
            const originalCount = parsedAccounts.length;
            parsedAccounts = parsedAccounts.filter(a =>
                a.name && a.name.trim() !== '' &&
                !isNaN(a.balance) && a.balance !== null && a.balance !== undefined
            );
            const removedCount = originalCount - parsedAccounts.length;
            if (removedCount > 0) {
                console.warn(`loadData: Removed ${removedCount} invalid account entries`);
                // Save cleaned accounts back to localStorage
                this.accounts.set(parsedAccounts);
                this.saveAccounts();
            } else {
                this.accounts.set(parsedAccounts);
            }
        }
        if (categoriesData) {
            let parsedCategories: Category[] = JSON.parse(categoriesData);

            // Filter out invalid/corrupted categories (missing name or invalid type)
            const originalCount = parsedCategories.length;
            parsedCategories = parsedCategories.filter(c =>
                c.name && typeof c.name === 'string' && c.name.trim() !== '' &&
                ['income', 'expense', 'both'].includes(c.type)
            );
            const removedCount = originalCount - parsedCategories.length;
            if (removedCount > 0) {
                console.warn(`loadData: Removed ${removedCount} invalid/corrupted category entries`);
                // Save cleaned categories back to localStorage
                this.categories.set(parsedCategories);
                this.saveCategories();
            } else {
                this.categories.set(parsedCategories);
            }
        }
        if (fixedCostsData) {
            let parsedFixedCosts: FixedCost[] = JSON.parse(fixedCostsData);

            // Filter out invalid fixed costs (missing name, NaN amount, or missing category/account)
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

            // Migration: Add order field to existing fixed costs if missing
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
        }
        if (fixedCostGroupsData) this.fixedCostGroups.set(JSON.parse(fixedCostGroupsData));
    }

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

    // ==================== Account Operations ====================

    selectAccount(id: string | null) {
        if (this.selectedAccountId() === id) {
            this.selectedAccountId.set(null);
        } else {
            this.selectedAccountId.set(id);
        }
    }

    updateAccountBalance(accountId: string, delta: number) {
        this.accounts.update(accounts =>
            accounts.map(a =>
                a.id === accountId ? { ...a, balance: a.balance + delta } : a
            )
        );
    }

    addAccount(name: string, balance: number) {
        // Validate data to prevent empty/invalid entries
        if (!name || name.trim() === '') {
            console.warn('addAccount: Invalid data - missing name');
            return;
        }
        if (isNaN(balance) || balance === null || balance === undefined) {
            console.warn('addAccount: Invalid data - invalid balance');
            return;
        }

        const account: Account = {
            id: this.utilityService.generateId(),
            name: name.trim(),
            balance
        };
        this.accounts.update(a => [...a, account]);
        this.saveAccounts();
    }

    updateAccount(id: string, name: string, balance: number) {
        this.accounts.update(accounts =>
            accounts.map(a => a.id === id ? { ...a, name, balance } : a)
        );
        this.saveAccounts();
    }

    deleteAccount(id: string): boolean {
        this.accounts.update(a => a.filter(account => account.id !== id));
        this.saveAccounts();
        if (this.selectedAccountId() === id) {
            this.selectAccount(null);
        }
        return true;
    }

    // ==================== Category Operations ====================

    addCategory(name: string, type: 'income' | 'expense' | 'both') {
        console.log('[StateService] addCategory called with name:', name, 'type:', type);

        // Validate data to prevent corrupted entries
        if (!name || typeof name !== 'string' || name.trim() === '') {
            console.warn('[StateService] addCategory: Invalid data - missing or invalid name');
            return;
        }
        if (!['income', 'expense', 'both'].includes(type)) {
            console.warn('[StateService] addCategory: Invalid data - invalid type:', type);
            return;
        }

        const category: Category = {
            id: this.utilityService.generateId(),
            name: name.trim(),
            type
        };
        console.log('[StateService] Created new category object:', JSON.stringify(category));
        console.log('[StateService] Categories BEFORE update:', JSON.stringify(this.categories()));
        this.categories.update(c => [...c, category]);
        console.log('[StateService] Categories AFTER update:', JSON.stringify(this.categories()));
        this.saveCategories();
        console.log('[StateService] Categories saved to localStorage');
    }

    updateCategory(id: string, name: string, type: 'income' | 'expense' | 'both') {
        this.categories.update(categories =>
            categories.map(c => c.id === id ? { ...c, name, type } : c)
        );
        this.saveCategories();
    }

    deleteCategory(id: string) {
        this.categories.update(c => c.filter(category => category.id !== id));
        this.saveCategories();
    }

    deleteAllCategories() {
        console.log('[StateService] deleteAllCategories called');
        console.log('[StateService] Categories BEFORE:', JSON.stringify(this.categories()));
        this.categories.set([]);
        this.saveCategories();
        console.log('[StateService] Categories AFTER:', JSON.stringify(this.categories()));
        console.log('[StateService] Categories saved to localStorage');
    }

    deleteSelectedCategories(ids: string[]) {
        console.log('[StateService] deleteSelectedCategories called with ids:', ids);
        console.log('[StateService] Categories BEFORE:', JSON.stringify(this.categories()));
        this.categories.update(c => c.filter(category => !ids.includes(category.id)));
        this.saveCategories();
        console.log('[StateService] Categories AFTER:', JSON.stringify(this.categories()));
        console.log('[StateService] Categories saved to localStorage');
    }

    getOrCreateCategory(categoryNameRaw: string, categoriesMap: Map<string, Category>): string {
        const categoryName = categoryNameRaw.trim();

        let category = categoriesMap.get(categoryName);
        if (!category) {
            category = {
                id: this.utilityService.generateId(),
                name: categoryName,
                type: 'both'
            };
            categoriesMap.set(categoryName, category);
        }
        return category.id;
    }

    // ==================== Transaction Balance Operations ====================

    revertTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.updateAccountBalance(t.account, t.amount); // Add back to source
            this.updateAccountBalance(t.toAccount, -t.amount); // Deduct from dest
        } else if (t.type === 'income') {
            this.updateAccountBalance(t.account, -t.amount); // Deduct
        } else {
            this.updateAccountBalance(t.account, t.amount); // Add back
        }
    }

    applyTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.updateAccountBalance(t.account, -t.amount);
            this.updateAccountBalance(t.toAccount, t.amount);
        } else if (t.type === 'income') {
            this.updateAccountBalance(t.account, t.amount);
        } else {
            this.updateAccountBalance(t.account, -t.amount);
        }
    }

    // ==================== Transaction Operations ====================

    addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
        const newTransaction: Transaction = {
            ...transaction,
            id: this.utilityService.generateId()
        };
        this.applyTransactionBalance(newTransaction);
        this.transactions.update(t => [...t, newTransaction]);
        this.saveTransactions();
        this.saveAccounts();
        return newTransaction;
    }

    updateTransaction(id: string, transactionData: Omit<Transaction, 'id'>, oldTransaction: Transaction) {
        const updatedTransaction: Transaction = {
            ...transactionData,
            id
        };
        this.revertTransactionBalance(oldTransaction);
        this.applyTransactionBalance(updatedTransaction);
        this.transactions.update(t => t.map(item => item.id === id ? updatedTransaction : item));
        this.saveTransactions();
        this.saveAccounts();
    }

    deleteTransaction(id: string) {
        const transaction = this.transactions().find(t => t.id === id);
        if (!transaction) return;

        this.revertTransactionBalance(transaction);
        this.transactions.update(t => t.filter(item => item.id !== id));
        this.saveTransactions();
        this.saveAccounts();
    }

    deleteAllTransactions() {
        // Revert balances for all transactions
        this.transactions().forEach(t => this.revertTransactionBalance(t));
        // Clear transactions
        this.transactions.set([]);
        // Save changes
        this.saveTransactions();
        this.saveAccounts();
    }

    // ==================== Fixed Cost Operations ====================

    getFixedCosts(): FixedCost[] {
        return this.fixedCosts();
    }

    getFixedCostsSortedByCategory(): FixedCost[] {
        return [...this.fixedCosts()].sort((a, b) => {
            const categoryA = this.getCategoryFullName(a.category).toLowerCase();
            const categoryB = this.getCategoryFullName(b.category).toLowerCase();
            return categoryA.localeCompare(categoryB, 'de');
        });
    }

    getFixedCostsTotal(): number {
        return this.fixedCosts()
            .filter(fc => fc.type === 'expense' && !fc.excludeFromTotal)
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getFixedIncomeTotal(): number {
        return this.fixedCosts()
            .filter(fc => fc.type === 'income' && !fc.excludeFromTotal)
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getFixedTransferTotal(): number {
        return this.fixedCosts()
            .filter(fc => fc.type === 'transfer' && !fc.excludeFromTotal)
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getExcludedFixedCostsTotal(): number {
        return this.fixedCosts()
            .filter(fc => fc.excludeFromTotal)
            .reduce((sum, fc) => {
                if (fc.type === 'income') return sum + fc.amount;
                return sum - fc.amount;
            }, 0);
    }

    getFixedIncomeCount(): number {
        return this.fixedCosts().filter(fc => fc.type === 'income' && !fc.excludeFromTotal).length;
    }

    getFixedExpenseCount(): number {
        return this.fixedCosts().filter(fc => fc.type === 'expense' && !fc.excludeFromTotal).length;
    }

    getFixedTransferCount(): number {
        return this.fixedCosts().filter(fc => fc.type === 'transfer' && !fc.excludeFromTotal).length;
    }

    getExcludedFixedCostsCount(): number {
        return this.fixedCosts().filter(fc => fc.excludeFromTotal).length;
    }

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
    }) {
        // Validate data to prevent empty/invalid entries
        if (!data.name || data.name.trim() === '') {
            console.warn('addFixedCost: Invalid data - missing name');
            return;
        }
        if (isNaN(data.amount) || data.amount === null || data.amount === undefined) {
            console.warn('addFixedCost: Invalid data - invalid amount');
            return;
        }
        if (!data.category || !data.account) {
            console.warn('addFixedCost: Invalid data - missing category or account');
            return;
        }

        const currentFixedCosts = this.fixedCosts();
        const maxOrder = currentFixedCosts.length > 0
            ? Math.max(...currentFixedCosts.map(fc => fc.order))
            : -1;

        const fixedCost: FixedCost = {
            id: this.utilityService.generateId(),
            name: data.name.trim(),
            amount: data.amount,
            type: data.type,
            category: data.category,
            account: data.account,
            toAccount: data.toAccount,
            groupId: data.groupId,
            order: maxOrder + 1,
            note: data.note,
            excludeFromTotal: data.excludeFromTotal
        };
        this.fixedCosts.update(fc => [...fc, fixedCost]);
        this.saveFixedCosts();
    }

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
    }) {
        this.fixedCosts.update(fcs =>
            fcs.map(fc => fc.id === id ? {
                ...fc,
                name: data.name,
                amount: data.amount,
                type: data.type,
                category: data.category,
                account: data.account,
                toAccount: data.toAccount,
                groupId: data.groupId,
                note: data.note,
                excludeFromTotal: data.excludeFromTotal
            } : fc)
        );
        this.saveFixedCosts();
    }

    deleteFixedCost(id: string) {
        this.fixedCosts.update(fc => fc.filter(item => item.id !== id));
        this.saveFixedCosts();
    }

    copyTransactionToFixedCost(transaction: Transaction) {
        const currentFixedCosts = this.fixedCosts();
        const maxOrder = currentFixedCosts.length > 0
            ? Math.max(...currentFixedCosts.map(fc => fc.order))
            : -1;

        const fixedCost: FixedCost = {
            id: this.utilityService.generateId(),
            name: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            account: transaction.account,
            toAccount: transaction.toAccount,
            order: maxOrder + 1,
            note: transaction.note
        };

        this.fixedCosts.update(fc => [...fc, fixedCost]);
        this.saveFixedCosts();
    }

    // ==================== Fixed Cost Group Operations ====================

    addFixedCostGroup(name: string) {
        const currentGroups = this.fixedCostGroups();
        const maxOrder = currentGroups.length > 0
            ? Math.max(...currentGroups.map(g => g.order))
            : -1;

        const group: FixedCostGroup = {
            id: this.utilityService.generateId(),
            name,
            order: maxOrder + 1,
            collapsed: false
        };
        this.fixedCostGroups.update(g => [...g, group]);
        this.saveFixedCostGroups();
        return group;
    }

    updateFixedCostGroup(id: string, name: string) {
        this.fixedCostGroups.update(groups =>
            groups.map(g => g.id === id ? { ...g, name } : g)
        );
        this.saveFixedCostGroups();
    }

    deleteFixedCostGroup(id: string) {
        // Remove group and unassign fixed costs from this group
        this.fixedCostGroups.update(g => g.filter(group => group.id !== id));
        this.fixedCosts.update(fcs =>
            fcs.map(fc => fc.groupId === id ? { ...fc, groupId: undefined } : fc)
        );
        this.saveFixedCostGroups();
        this.saveFixedCosts();
    }

    toggleFixedCostGroupCollapsed(id: string) {
        this.fixedCostGroups.update(groups =>
            groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
        );
        this.saveFixedCostGroups();
    }

    reorderFixedCosts(fixedCostIds: string[]) {
        // Get the minimum order value of the items being reordered
        const currentFixedCosts = this.fixedCosts();
        const reorderedItems = fixedCostIds.map(id => currentFixedCosts.find(fc => fc.id === id)).filter(Boolean) as FixedCost[];
        const minOrder = reorderedItems.length > 0 ? Math.min(...reorderedItems.map(fc => fc.order)) : 0;

        this.fixedCosts.update(fcs => {
            return fcs.map(fc => {
                const newIndex = fixedCostIds.indexOf(fc.id);
                if (newIndex !== -1) {
                    return { ...fc, order: minOrder + newIndex };
                }
                return fc;
            });
        });
        this.saveFixedCosts();
    }

    reorderFixedCostGroups(groupIds: string[]) {
        this.fixedCostGroups.update(groups => {
            return groups.map(g => {
                const newOrder = groupIds.indexOf(g.id);
                return newOrder !== -1 ? { ...g, order: newOrder } : g;
            });
        });
        this.saveFixedCostGroups();
    }

    deleteAllFixedCostGroups() {
        // Unassign all fixed costs from groups
        this.fixedCosts.update(fcs =>
            fcs.map(fc => ({ ...fc, groupId: undefined }))
        );
        // Clear all groups
        this.fixedCostGroups.set([]);
        this.saveFixedCostGroups();
        this.saveFixedCosts();
    }

    deleteSelectedFixedCostGroups(ids: string[]) {
        // Unassign fixed costs from selected groups
        this.fixedCosts.update(fcs =>
            fcs.map(fc => ids.includes(fc.groupId || '') ? { ...fc, groupId: undefined } : fc)
        );
        // Remove selected groups
        this.fixedCostGroups.update(groups =>
            groups.filter(g => !ids.includes(g.id))
        );
        this.saveFixedCostGroups();
        this.saveFixedCosts();
    }

    getFixedCostsSortedByOrder(): FixedCost[] {
        return [...this.fixedCosts()].sort((a, b) => a.order - b.order);
    }

    getFixedCostGroupsSortedByOrder(): FixedCostGroup[] {
        return [...this.fixedCostGroups()].sort((a, b) => a.order - b.order);
    }

    // ==================== Filtering ====================

    onSearch(query: string) {
        this.searchQuery.set(query);
    }

    onMonthChange(date: Date) {
        this.selectedMonth.set(date);
    }

    getFilteredTransactions(): Transaction[] {
        let filtered = this.transactions();

        // Filter by Account
        if (this.selectedAccountId()) {
            filtered = filtered.filter(t =>
                t.account === this.selectedAccountId() ||
                (t.type === 'transfer' && t.toAccount === this.selectedAccountId())
            );
        }

        // Filter by Search
        const query = this.searchQuery().toLowerCase();
        if (query) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.amount.toString().includes(query) ||
                this.getCategoryFullName(t.category).toLowerCase().includes(query)
            );
        }
        return filtered;
    }

    getSortedTransactions(): Transaction[] {
        let filtered = this.getFilteredTransactions();

        // Filter by Month
        const currentMonth = this.selectedMonth().getMonth();
        const currentYear = this.selectedMonth().getFullYear();

        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        return filtered.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }

    // ==================== Import/Export ====================

    importExtendedFormat(data: { transaktionen: any[], fixkosten: any[] }): { transactions: number, fixedCosts: number } {
        const newTransactions: Transaction[] = [];
        const newFixedCosts: FixedCost[] = [];

        // Local maps for batch processing
        const accountsMap = new Map<string, Account>();
        const categoriesMap = new Map<string, Category>();
        this.categories().forEach(c => categoriesMap.set(c.name, c));

        // Process transactions
        data.transaktionen.forEach(item => {
            if (!item.datum || item.betrag === undefined || !item.beschreibung) return;

            const amountRaw = parseFloat(item.betrag);
            const dateRaw = item.datum.trim();
            const description = item.beschreibung.trim();
            const accountName = (item.konto || 'Unbekannt').trim();
            const categoryNameRaw = (item.kategorie || 'Sonstiges').trim();

            // Handle Account
            let account = accountsMap.get(accountName);
            if (!account) {
                account = {
                    id: this.utilityService.generateId(),
                    name: accountName,
                    balance: 0
                };
                accountsMap.set(accountName, account);
            }
            account.balance += amountRaw;

            // Handle Category
            const categoryId = this.getOrCreateCategory(categoryNameRaw, categoriesMap);

            // Create Transaction
            const amount = Math.abs(amountRaw);
            const type: 'income' | 'expense' = amountRaw >= 0 ? 'income' : 'expense';

            const transaction: Transaction = {
                id: this.utilityService.generateId(),
                type,
                amount,
                description,
                category: categoryId,
                account: account.id,
                date: dateRaw.split('T')[0]
            };

            newTransactions.push(transaction);
        });

        // Process fixed costs
        if (data.fixkosten && Array.isArray(data.fixkosten)) {
            data.fixkosten.forEach(item => {
                if (!item.name || item.betrag === undefined) return;

                const amountRaw = parseFloat(item.betrag);
                const name = item.name.trim();
                const accountName = (item.konto || 'Unbekannt').trim();
                const categoryNameRaw = (item.kategorie || 'Sonstiges').trim();

                // Handle Account (ensure it exists)
                let account = accountsMap.get(accountName);
                if (!account) {
                    account = {
                        id: this.utilityService.generateId(),
                        name: accountName,
                        balance: 0
                    };
                    accountsMap.set(accountName, account);
                }

                // Handle Category
                const categoryId = this.getOrCreateCategory(categoryNameRaw, categoriesMap);

                // Create Fixed Cost
                const amount = Math.abs(amountRaw);
                const type: 'income' | 'expense' = amountRaw >= 0 ? 'income' : 'expense';

                const fixedCost: FixedCost = {
                    id: this.utilityService.generateId(),
                    name,
                    amount,
                    type,
                    category: categoryId,
                    account: account.id,
                    order: newFixedCosts.length
                };

                newFixedCosts.push(fixedCost);
            });
        }

        // Save all data
        this.transactions.set(newTransactions);
        this.accounts.set(Array.from(accountsMap.values()));
        this.categories.set(Array.from(categoriesMap.values()));
        this.fixedCosts.set(newFixedCosts);

        this.saveTransactions();
        this.saveAccounts();
        this.saveCategories();
        this.saveFixedCosts();

        return { transactions: newTransactions.length, fixedCosts: newFixedCosts.length };
    }

    importLegacyFormat(jsonData: any[]): number {
        const newTransactions: Transaction[] = [];

        // Local maps for batch processing
        const accountsMap = new Map<string, Account>();
        const categoriesMap = new Map<string, Category>();
        this.categories().forEach(c => categoriesMap.set(c.name, c));

        jsonData.forEach(item => {
            if (!item.datum || item.betrag === undefined || !item.beschreibung) return;

            const amountRaw = parseFloat(item.betrag);
            const dateRaw = item.datum.trim();
            const description = item.beschreibung.trim();
            const accountName = (item.konto || 'Unbekannt').trim();
            const categoryNameRaw = (item.kategorie || 'Sonstiges').trim();

            // Handle Account
            let account = accountsMap.get(accountName);
            if (!account) {
                account = {
                    id: this.utilityService.generateId(),
                    name: accountName,
                    balance: 0
                };
                accountsMap.set(accountName, account);
            }
            account.balance += amountRaw;

            // Handle Category
            const categoryId = this.getOrCreateCategory(categoryNameRaw, categoriesMap);

            // Create Transaction
            const amount = Math.abs(amountRaw);
            const type: 'income' | 'expense' = amountRaw >= 0 ? 'income' : 'expense';

            const transaction: Transaction = {
                id: this.utilityService.generateId(),
                type,
                amount,
                description,
                category: categoryId,
                account: account.id,
                date: dateRaw.split('T')[0]
            };

            newTransactions.push(transaction);
        });

        if (newTransactions.length > 0) {
            this.transactions.set(newTransactions);
            this.accounts.set(Array.from(accountsMap.values()));
            this.categories.set(Array.from(categoriesMap.values()));

            this.saveTransactions();
            this.saveAccounts();
            this.saveCategories();
        }

        return newTransactions.length;
    }

    getExportData(): { version: number, exportDate: string, transaktionen: any[], fixkosten: any[] } {
        const transactionsData = this.transactions().map(t => {
            const account = this.getAccountById(t.account);
            const category = this.getCategoryById(t.category);
            const betrag = t.type === 'expense' ? -t.amount : t.amount;

            return {
                datum: t.date,
                betrag: betrag,
                beschreibung: t.description,
                konto: account?.name || '',
                kategorie: category?.name || ''
            };
        });

        const fixedCostsData = this.fixedCosts().map(fc => {
            const account = this.getAccountById(fc.account);
            const category = this.getCategoryById(fc.category);
            const betrag = fc.type === 'expense' ? -fc.amount : fc.amount;

            return {
                name: fc.name,
                betrag: betrag,
                konto: account?.name || '',
                kategorie: category?.name || ''
            };
        });

        return {
            version: 2,
            exportDate: new Date().toISOString(),
            transaktionen: transactionsData,
            fixkosten: fixedCostsData
        };
    }
}
