import { Injectable, inject } from '@angular/core';
import { Transaction, FixedCost, Account, Category } from '../budget.models';
import { BudgetDataService } from './budget-data.service';
import { BudgetCategoryService } from './budget-category.service';
import { BudgetUtilityService } from '../budget.utility.service';

/**
 * BudgetImportExportService - Manages import/export operations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetImportExportService {

    private dataService = inject(BudgetDataService);
    private categoryService = inject(BudgetCategoryService);
    private utilityService = inject(BudgetUtilityService);

    // ==================== Import Extended Format ====================

    importExtendedFormat(data: { transaktionen: any[], fixkosten: any[] }): { transactions: number, fixedCosts: number } {
        const newTransactions: Transaction[] = [];
        const newFixedCosts: FixedCost[] = [];

        // Local maps for batch processing
        const accountsMap = new Map<string, Account>();
        const categoriesMap = new Map<string, Category>();
        this.dataService.categories().forEach(c => categoriesMap.set(c.name, c));

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
            const categoryId = this.categoryService.getOrCreateCategory(categoryNameRaw, categoriesMap);

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
                const categoryId = this.categoryService.getOrCreateCategory(categoryNameRaw, categoriesMap);

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
        this.dataService.transactions.set(newTransactions);
        this.dataService.accounts.set(Array.from(accountsMap.values()));
        this.dataService.categories.set(Array.from(categoriesMap.values()));
        this.dataService.fixedCosts.set(newFixedCosts);

        this.dataService.saveTransactions();
        this.dataService.saveAccounts();
        this.dataService.saveCategories();
        this.dataService.saveFixedCosts();

        return { transactions: newTransactions.length, fixedCosts: newFixedCosts.length };
    }

    // ==================== Import Legacy Format ====================

    importLegacyFormat(jsonData: any[]): number {
        const newTransactions: Transaction[] = [];

        // Local maps for batch processing
        const accountsMap = new Map<string, Account>();
        const categoriesMap = new Map<string, Category>();
        this.dataService.categories().forEach(c => categoriesMap.set(c.name, c));

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
            const categoryId = this.categoryService.getOrCreateCategory(categoryNameRaw, categoriesMap);

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
            this.dataService.transactions.set(newTransactions);
            this.dataService.accounts.set(Array.from(accountsMap.values()));
            this.dataService.categories.set(Array.from(categoriesMap.values()));

            this.dataService.saveTransactions();
            this.dataService.saveAccounts();
            this.dataService.saveCategories();
        }

        return newTransactions.length;
    }

    // ==================== Export ====================

    getExportData(): { version: number, exportDate: string, transaktionen: any[], fixkosten: any[] } {
        const transactionsData = this.dataService.transactions().map(t => {
            const account = this.dataService.getAccountById(t.account);
            const category = this.dataService.getCategoryById(t.category);
            const betrag = t.type === 'expense' ? -t.amount : t.amount;

            return {
                datum: t.date,
                betrag: betrag,
                beschreibung: t.description,
                konto: account?.name || '',
                kategorie: category?.name || ''
            };
        });

        const fixedCostsData = this.dataService.fixedCosts().map(fc => {
            const account = this.dataService.getAccountById(fc.account);
            const category = this.dataService.getCategoryById(fc.category);
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

    // ==================== Import from CSV ====================

    importTransactionsFromCSV(transactions: Transaction[]): number {
        if (transactions.length === 0) return 0;

        // Replace all transactions
        this.dataService.transactions.set(transactions);
        this.dataService.saveTransactions();

        return transactions.length;
    }
}
