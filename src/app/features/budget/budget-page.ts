import { Component, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { BudgetCalendar } from './calendar/calendar';

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category: string;
    account: string;
    toAccount?: string; // For transfers
    date: string;
    isFixedCost?: boolean; // Mark as fixed cost
}

interface FixedCost {
    id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    account: string;
}

interface Account {
    id: string;
    name: string;
    balance: number;
}

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
}

@Component({
    selector: 'app-budget-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, AppsLauncher, BudgetCalendar, DecimalPipe],
    templateUrl: './budget-page.html',
    styleUrls: ['./budget-page.css']
})
export class BudgetPage {
    transactions = signal<Transaction[]>([]);
    accounts = signal<Account[]>([]);
    fixedCosts = signal<FixedCost[]>([]);
    isOnline = signal(true);

    categories = signal<Category[]>([]);

    editingCategory = signal<Category | null>(null);
    editingFixedCost = signal<FixedCost | null>(null);

    showTransactionModal = signal(false);
    showAccountModal = signal(false);
    showCategoryModal = signal(false);
    showSettingsModal = signal(false);
    showFixedCostModal = signal(false);
    settingsView = signal<'main' | 'accounts' | 'categories'>('main');

    // For pre-filling transaction from fixed cost
    prefillFromFixedCost = signal<FixedCost | null>(null);

    selectedMonth = signal(new Date());

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
        if (!this.showSettingsModal()) {
            this.settingsView.set('main'); // Reset view when closing
        }
    }

    currentTransactionType = signal<'income' | 'expense' | 'transfer'>('expense');

    constructor() {
        this.loadData();
        this.initializeDefaultCategories();
        this.initializeSampleData();

        window.addEventListener('blur', () => this.isOnline.set(false));
        window.addEventListener('focus', () => this.isOnline.set(true));
    }

    private loadData() {
        const transactionsData = localStorage.getItem('mybudget_transactions');
        const accountsData = localStorage.getItem('mybudget_accounts');
        const categoriesData = localStorage.getItem('mybudget_categories');
        const fixedCostsData = localStorage.getItem('mybudget_fixedcosts');

        if (transactionsData) this.transactions.set(JSON.parse(transactionsData));
        if (accountsData) this.accounts.set(JSON.parse(accountsData));
        if (categoriesData) this.categories.set(JSON.parse(categoriesData));
        if (fixedCostsData) this.fixedCosts.set(JSON.parse(fixedCostsData));
    }

    private initializeDefaultCategories() {
        // Default categories initialization disabled - app starts empty for import
        // Categories will be created automatically during import
    }

    private initializeSampleData() {
        // Sample data initialization disabled - app starts empty for import
        // To enable sample data, uncomment the code below
    }

    toggleTransactionModal() {
        this.showTransactionModal.set(!this.showTransactionModal());
    }

    toggleAccountModal() {
        this.showAccountModal.set(!this.showAccountModal());
    }

    toggleCategoryModal() {
        this.showCategoryModal.set(!this.showCategoryModal());
    }

    toggleFixedCostModal() {
        this.showFixedCostModal.set(!this.showFixedCostModal());
        if (!this.showFixedCostModal()) {
            this.editingFixedCost.set(null);
        }
    }

    setTransactionType(type: 'income' | 'expense' | 'transfer') {
        this.currentTransactionType.set(type);
    }

    expandedTransactionId = signal<string | null>(null);
    editingTransaction = signal<Transaction | null>(null);
    editingAccount = signal<Account | null>(null);
    inlineEditingTransactionId = signal<string | null>(null);
    inlineTransactionTypes = signal<Map<string, 'income' | 'expense' | 'transfer'>>(new Map());

    toggleExpansion(id: string) {
        if (this.expandedTransactionId() === id) {
            this.expandedTransactionId.set(null);
        } else {
            this.expandedTransactionId.set(id);
        }
    }

    deleteTransaction(id: string) {
        const transaction = this.transactions().find(t => t.id === id);
        if (!transaction) return;

        if (confirm('Möchten Sie diese Transaktion wirklich löschen?')) {
            this.revertTransactionBalance(transaction);
            this.transactions.update(t => t.filter(item => item.id !== id));
            this.saveTransactions();
            this.saveAccounts();
        }
    }

    deleteAllTransactions() {
        if (confirm('Sind Sie sicher, dass Sie ALLE Transaktionen löschen möchten? Dies kann nicht rückgängig gemacht werden.')) {
            // Revert balances for all transactions
            this.transactions().forEach(t => this.revertTransactionBalance(t));

            // Clear transactions
            this.transactions.set([]);

            // Save changes
            this.saveTransactions();
            this.saveAccounts();
        }
    }

    openEditModal(transaction: Transaction) {
        this.editingTransaction.set(transaction);
        this.currentTransactionType.set(transaction.type);
        this.showTransactionModal.set(true);
        // Date input needs explicit setting if not using ngModel fully or if timing issues
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) dateInput.value = transaction.date;
        }, 0);
    }

    onTransactionSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const type = this.currentTransactionType();
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string;
        const categoryId = formData.get('category') as string;
        const accountId = formData.get('account') as string;
        const toAccountId = formData.get('toAccount') as string;
        const date = formData.get('date') as string;

        const transactionData: Transaction = {
            id: this.editingTransaction() ? this.editingTransaction()!.id : this.generateId(),
            type,
            amount,
            description,
            category: categoryId,
            account: accountId,
            toAccount: type === 'transfer' ? toAccountId : undefined,
            date
        };

        if (this.editingTransaction()) {
            const oldTransaction = this.editingTransaction()!;
            this.revertTransactionBalance(oldTransaction);
            this.applyTransactionBalance(transactionData);

            this.transactions.update(t => t.map(item => item.id === transactionData.id ? transactionData : item));
        } else {
            this.applyTransactionBalance(transactionData);
            this.transactions.update(t => [...t, transactionData]);
        }

        this.saveTransactions();
        this.saveAccounts();
        this.toggleTransactionModal();
        form.reset();
        this.editingTransaction.set(null); // Reset editing state
        this.setTodayDate();
    }

    private revertTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.updateAccountBalance(t.account, t.amount); // Add back to source
            this.updateAccountBalance(t.toAccount, -t.amount); // Deduct from dest
        } else if (t.type === 'income') {
            this.updateAccountBalance(t.account, -t.amount); // Deduct
        } else {
            this.updateAccountBalance(t.account, t.amount); // Add back
        }
    }

    private applyTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.updateAccountBalance(t.account, -t.amount);
            this.updateAccountBalance(t.toAccount, t.amount);
        } else if (t.type === 'income') {
            this.updateAccountBalance(t.account, t.amount);
        } else {
            this.updateAccountBalance(t.account, -t.amount);
        }
    }

    openEditAccountModal(account: Account) {
        this.editingAccount.set(account);
        this.showAccountModal.set(true);
    }

    deleteAccount(id: string) {
        if (confirm('Möchten Sie dieses Konto wirklich löschen?')) {
            this.accounts.update(a => a.filter(account => account.id !== id));
            this.saveAccounts();
            if (this.selectedAccountId() === id) {
                this.selectAccount(null);
            }
        }
    }

    onAccountSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('accountName') as string;
        const balance = parseFloat(formData.get('accountBalance') as string);

        if (this.editingAccount()) {
            const updatedAccount = { ...this.editingAccount()!, name, balance };
            this.accounts.update(accounts =>
                accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a)
            );
        } else {
            const account: Account = {
                id: this.generateId(),
                name,
                balance
            };
            this.accounts.update(a => [...a, account]);
        }

        this.saveAccounts();
        this.toggleAccountModal();
        this.editingAccount.set(null);
        form.reset();
    }

    onCategorySubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('categoryName') as string;
        const type = (formData.get('categoryType') as 'income' | 'expense' | 'both') || 'both';

        if (this.editingCategory()) {
            const updatedCategory = { ...this.editingCategory()!, name, type };
            this.categories.update(categories =>
                categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
            );
        } else {
            const category: Category = {
                id: this.generateId(),
                name,
                type
            };
            this.categories.update(c => [...c, category]);
        }

        this.saveCategories();
        this.toggleCategoryModal();
        this.editingCategory.set(null);
        form.reset();
    }

    deleteCategory(id: string) {
        if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
            this.categories.update(c => c.filter(category => category.id !== id));
            this.saveCategories();
        }
    }

    openEditCategoryModal(category: Category) {
        this.editingCategory.set(category);
        this.showCategoryModal.set(true);
    }

    selectedAccountId = signal<string | null>(null);
    searchQuery = signal<string>('');

    selectAccount(id: string | null) {
        if (this.selectedAccountId() === id) {
            this.selectedAccountId.set(null);
        } else {
            this.selectedAccountId.set(id);
        }
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    getStats() {
        const now = new Date();
        // Use selectedMonth for stats or keep it current month?
        // The user said "pro seite sollen transaktionen von diesem monat angezeigt werden" (per page transactions of THIS month should be displayed).
        // Usually stats follow the view. Let's use selectedMonth for stats too.
        const currentMonth = this.selectedMonth().getMonth();
        const currentYear = this.selectedMonth().getFullYear();

        // 1. Calculate Balance (Account Filter Only)
        let balance = 0;
        if (this.selectedAccountId()) {
            const account = this.accounts().find(a => a.id === this.selectedAccountId());
            balance = account ? account.balance : 0;
        } else {
            balance = this.accounts().reduce((sum, a) => sum + a.balance, 0);
        }

        // 2. Calculate Income/Expenses (Account + Search + Month)
        let transactionsForStats = this.transactions();

        // Filter by Account
        if (this.selectedAccountId()) {
            transactionsForStats = transactionsForStats.filter(t =>
                t.account === this.selectedAccountId() ||
                (t.type === 'transfer' && t.toAccount === this.selectedAccountId())
            );
        }

        // Filter by Search
        const query = this.searchQuery().toLowerCase();
        if (query) {
            transactionsForStats = transactionsForStats.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.amount.toString().includes(query) ||
                this.getCategoryFullName(t.category).toLowerCase().includes(query)
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

    getFilteredTransactions() {
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

    getSortedTransactions() {
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

    onMonthChange(date: Date) {
        this.selectedMonth.set(date);
    }

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

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    getTotalBalance(): number {
        return this.accounts().reduce((sum, a) => sum + a.balance, 0);
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getTodayDateString(): string {
        return new Date().toISOString().split('T')[0];
    }

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        input.click();
    }

    triggerExport() {
        const transactions = this.transactions();
        const fixedCosts = this.fixedCosts();

        if (transactions.length === 0 && fixedCosts.length === 0) {
            alert('Keine Daten zum Exportieren vorhanden.');
            return;
        }

        // Build JSON content with extended format including fixed costs
        const transactionsData = transactions.map(t => {
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

        const fixedCostsData = fixedCosts.map(fc => {
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

        // Export as extended format with both transactions and fixed costs
        const exportData = {
            version: 2,
            exportDate: new Date().toISOString(),
            transaktionen: transactionsData,
            fixkosten: fixedCostsData
        };

        const jsonContent = JSON.stringify(exportData, null, 2);

        // Create and download file
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `budget_export_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private processImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            this.parseAndImportJSON(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportJSON(jsonString: string) {
        let jsonData: any;
        try {
            jsonData = JSON.parse(jsonString);
        } catch (error) {
            alert('Fehler beim Parsen der JSON-Datei. Bitte überprüfen Sie das Format.');
            return;
        }

        // Check if it's the new extended format (version 2) or legacy format
        if (jsonData.version === 2 && jsonData.transaktionen) {
            this.importExtendedFormat(jsonData);
        } else if (Array.isArray(jsonData)) {
            // Legacy format - array of transactions
            this.importLegacyFormat(jsonData);
        } else {
            alert('Unbekanntes Dateiformat. Bitte überprüfen Sie die JSON-Datei.');
        }
    }

    private importExtendedFormat(data: { transaktionen: any[], fixkosten: any[] }) {
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
                    id: this.generateId(),
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
                id: this.generateId(),
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
                        id: this.generateId(),
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
                    id: this.generateId(),
                    name,
                    amount,
                    type,
                    category: categoryId,
                    account: account.id
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

        const message = `Import erfolgreich:\n- ${newTransactions.length} Transaktionen\n- ${newFixedCosts.length} Fixkosten`;
        alert(message);
    }

    private importLegacyFormat(jsonData: any[]) {
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
                    id: this.generateId(),
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
                id: this.generateId(),
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

            alert(`${newTransactions.length} Transaktionen erfolgreich importiert.`);
        } else {
            alert('Keine gültigen Transaktionen in der Datei gefunden.');
        }
    }

    private getOrCreateCategory(categoryNameRaw: string, categoriesMap: Map<string, Category>): string {
        // Flatten category name - if it contains '/', use the full string as category name
        const categoryName = categoryNameRaw.trim();

        let category = categoriesMap.get(categoryName);
        if (!category) {
            category = {
                id: this.generateId(),
                name: categoryName,
                type: 'both'
            };
            categoriesMap.set(categoryName, category);
        }
        return category.id;
    }

    private updateAccountBalance(accountId: string, delta: number) {
        this.accounts.update(accounts =>
            accounts.map(a =>
                a.id === accountId ? { ...a, balance: a.balance + delta } : a
            )
        );
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private setTodayDate() {
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }, 0);
    }

    private saveTransactions() {
        localStorage.setItem('mybudget_transactions', JSON.stringify(this.transactions()));
    }

    private saveAccounts() {
        localStorage.setItem('mybudget_accounts', JSON.stringify(this.accounts()));
    }

    private saveCategories() {
        localStorage.setItem('mybudget_categories', JSON.stringify(this.categories()));
    }

    private saveFixedCosts() {
        localStorage.setItem('mybudget_fixedcosts', JSON.stringify(this.fixedCosts()));
    }

    // Fixed Costs Methods
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
            .filter(fc => fc.type === 'expense')
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getFixedIncomeTotal(): number {
        return this.fixedCosts()
            .filter(fc => fc.type === 'income')
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getFixedIncomeCount(): number {
        return this.fixedCosts().filter(fc => fc.type === 'income').length;
    }

    getFixedExpenseCount(): number {
        return this.fixedCosts().filter(fc => fc.type === 'expense').length;
    }

    openEditFixedCostModal(fixedCost: FixedCost) {
        this.editingFixedCost.set(fixedCost);
        this.showFixedCostModal.set(true);
    }

    deleteFixedCost(id: string) {
        if (confirm('Möchten Sie diese Fixkosten wirklich löschen?')) {
            this.fixedCosts.update(fc => fc.filter(item => item.id !== id));
            this.saveFixedCosts();
        }
    }

    onFixedCostSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('fixedCostName') as string;
        const amount = parseFloat(formData.get('fixedCostAmount') as string);
        const type = formData.get('fixedCostType') as 'income' | 'expense';
        const categoryId = formData.get('fixedCostCategory') as string;
        const accountId = formData.get('fixedCostAccount') as string;

        if (this.editingFixedCost()) {
            const updatedFixedCost: FixedCost = {
                ...this.editingFixedCost()!,
                name,
                amount,
                type,
                category: categoryId,
                account: accountId
            };
            this.fixedCosts.update(fcs =>
                fcs.map(fc => fc.id === updatedFixedCost.id ? updatedFixedCost : fc)
            );
        } else {
            const fixedCost: FixedCost = {
                id: this.generateId(),
                name,
                amount,
                type,
                category: categoryId,
                account: accountId
            };
            this.fixedCosts.update(fc => [...fc, fixedCost]);
        }

        this.saveFixedCosts();
        this.toggleFixedCostModal();
        form.reset();
    }

    createTransactionFromFixedCost(fixedCost: FixedCost) {
        // Set the prefill data and open the transaction modal
        this.prefillFromFixedCost.set(fixedCost);
        this.currentTransactionType.set(fixedCost.type);
        this.showTransactionModal.set(true);

        // Set today's date after modal opens
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }, 0);
    }

    clearPrefillData() {
        this.prefillFromFixedCost.set(null);
    }

    copyTransactionToFixedCost(transaction: Transaction) {
        // Create a new fixed cost from the transaction
        const fixedCost: FixedCost = {
            id: this.generateId(),
            name: transaction.description,
            amount: transaction.amount,
            type: transaction.type === 'transfer' ? 'expense' : transaction.type,
            category: transaction.category,
            account: transaction.account
        };

        this.fixedCosts.update(fc => [...fc, fixedCost]);
        this.saveFixedCosts();

        // Show confirmation
        alert(`"${transaction.description}" wurde als Fixkosten gespeichert.`);
    }

    // Inline editing methods
    toggleInlineEdit(transactionId: string) {
        if (this.inlineEditingTransactionId() === transactionId) {
            this.inlineEditingTransactionId.set(null);
        } else {
            const transaction = this.transactions().find(t => t.id === transactionId);
            if (transaction) {
                this.inlineEditingTransactionId.set(transactionId);
                // Initialize the type for this transaction
                this.inlineTransactionTypes.update(map => {
                    const newMap = new Map(map);
                    newMap.set(transactionId, transaction.type);
                    return newMap;
                });
            }
        }
    }

    cancelInlineEdit(transactionId: string) {
        this.inlineEditingTransactionId.set(null);
        this.inlineTransactionTypes.update(map => {
            const newMap = new Map(map);
            newMap.delete(transactionId);
            return newMap;
        });
    }

    isEditingInline(transactionId: string): boolean {
        return this.inlineEditingTransactionId() === transactionId;
    }

    setInlineTransactionType(transactionId: string, type: 'income' | 'expense' | 'transfer') {
        this.inlineTransactionTypes.update(map => {
            const newMap = new Map(map);
            newMap.set(transactionId, type);
            return newMap;
        });
    }

    getInlineTransactionType(transactionId: string): 'income' | 'expense' | 'transfer' {
        const transaction = this.transactions().find(t => t.id === transactionId);
        return this.inlineTransactionTypes().get(transactionId) || transaction?.type || 'expense';
    }

    onInlineTransactionEdit(event: Event, transactionId: string) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const type = this.getInlineTransactionType(transactionId);
        const amount = parseFloat(formData.get('amount') as string);
        const description = formData.get('description') as string;
        const categoryId = formData.get('category') as string;
        const accountId = formData.get('account') as string;
        const toAccountId = formData.get('toAccount') as string;
        const date = formData.get('date') as string;

        // Validate: Transfer requires toAccount
        if (type === 'transfer' && !toAccountId) {
            alert('Bei einem Transfer muss ein Zielkonto angegeben werden.');
            return;
        }

        const oldTransaction = this.transactions().find(t => t.id === transactionId);
        if (!oldTransaction) return;

        const updatedTransaction: Transaction = {
            id: transactionId,
            type,
            amount,
            description,
            category: categoryId,
            account: accountId,
            toAccount: type === 'transfer' ? toAccountId : undefined,
            date
        };

        // Revert old transaction balance and apply new one
        this.revertTransactionBalance(oldTransaction);
        this.applyTransactionBalance(updatedTransaction);

        // Update the transaction
        this.transactions.update(t => t.map(item => item.id === transactionId ? updatedTransaction : item));

        this.saveTransactions();
        this.saveAccounts();

        // Exit edit mode
        this.cancelInlineEdit(transactionId);
    }

    viewMode = signal<'transactions' | 'statistics' | 'fixedcosts'>('transactions');

    toggleViewMode(mode: 'transactions' | 'statistics' | 'fixedcosts') {
        this.viewMode.set(mode);
    }

    getCategoryStats() {
        const transactions = this.getSortedTransactions().filter(t => t.type === 'expense');
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        const stats = new Map<string, number>();
        transactions.forEach(t => {
            const current = stats.get(t.category) || 0;
            stats.set(t.category, current + t.amount);
        });

        return Array.from(stats.entries())
            .map(([id, amount]) => ({
                name: this.getCategoryFullName(id),
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: this.getCategoryColor(id)
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    getDailyTrend() {
        const transactions = this.getSortedTransactions();
        const daysInMonth = new Date(this.selectedMonth().getFullYear(), this.selectedMonth().getMonth() + 1, 0).getDate();
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
                    if (this.selectedAccountId()) {
                        if (t.account === this.selectedAccountId()) {
                            currentBalance -= t.amount;
                        } else if (t.toAccount === this.selectedAccountId()) {
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

    private getCategoryColor(id: string): string {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 50%)`;
    }

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

    getTrendPoints(): string {
        const data = this.getDailyTrend();
        if (data.length === 0) return '';

        const maxBalance = Math.max(...data.map(d => d.balance), 100); // Avoid div by 0
        const minBalance = Math.min(...data.map(d => d.balance), 0);
        const range = maxBalance - minBalance || 1; // Avoid div by 0

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

    // Additional statistics methods
    Math = Math; // Expose Math to template

    getSelectedMonthName(): string {
        return this.selectedMonth().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }

    getIncomeTransactionCount(): number {
        return this.getSortedTransactions().filter(t => t.type === 'income').length;
    }

    getExpenseTransactionCount(): number {
        return this.getSortedTransactions().filter(t => t.type === 'expense').length;
    }

    getIncomeCategoryStats() {
        const transactions = this.getSortedTransactions().filter(t => t.type === 'income');
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        const stats = new Map<string, number>();
        transactions.forEach(t => {
            const current = stats.get(t.category) || 0;
            stats.set(t.category, current + t.amount);
        });

        return Array.from(stats.entries())
            .map(([id, amount]) => ({
                name: this.getCategoryFullName(id),
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: this.getCategoryColor(id)
            }))
            .sort((a, b) => b.amount - a.amount);
    }

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

    getDaysInSelectedMonth(): number {
        return new Date(this.selectedMonth().getFullYear(), this.selectedMonth().getMonth() + 1, 0).getDate();
    }

    getTrendMaxValue(): number {
        const data = this.getDailyTrend();
        if (data.length === 0) return 100;
        return Math.max(...data.map(d => d.balance), 100);
    }

    getTrendMinValue(): number {
        const data = this.getDailyTrend();
        if (data.length === 0) return 0;
        return Math.min(...data.map(d => d.balance), 0);
    }

    getZeroLineY(): number {
        const max = this.getTrendMaxValue();
        const min = this.getTrendMinValue();
        const range = max - min || 1;
        const height = 50;
        return height - ((0 - min) / range) * height;
    }

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

    getTopExpenses(): Transaction[] {
        return this.getSortedTransactions()
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);
    }

    getAverageDailyExpense(): number {
        const expenses = this.getStats().expenses;
        const daysInMonth = this.getDaysInSelectedMonth();
        return expenses / daysInMonth;
    }

    getAverageDailyIncome(): number {
        const income = this.getStats().income;
        const daysInMonth = this.getDaysInSelectedMonth();
        return income / daysInMonth;
    }

    getLargestExpense(): number {
        const expenses = this.getSortedTransactions().filter(t => t.type === 'expense');
        if (expenses.length === 0) return 0;
        return Math.max(...expenses.map(t => t.amount));
    }

    getLargestIncome(): number {
        const incomes = this.getSortedTransactions().filter(t => t.type === 'income');
        if (incomes.length === 0) return 0;
        return Math.max(...incomes.map(t => t.amount));
    }
}
