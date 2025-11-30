import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category: string;
    account: string;
    toAccount?: string; // For transfers
    date: string;
}

interface Account {
    id: string;
    name: string;
    balance: number;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    type: 'income' | 'expense' | 'both';
}

@Component({
    selector: 'app-budget-page',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, AppsLauncher],
    templateUrl: './budget-page.html',
    styleUrls: ['./budget-page.css']
})
export class BudgetPage {
    transactions = signal<Transaction[]>([]);
    accounts = signal<Account[]>([]);

    categories = signal<Category[]>([]);

    editingCategory = signal<Category | null>(null);

    showTransactionModal = signal(false);
    showAccountModal = signal(false);
    showCategoryModal = signal(false);
    showSettingsModal = signal(false);
    settingsView = signal<'main' | 'accounts' | 'categories'>('main');

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

    }

    private loadData() {
        const transactionsData = localStorage.getItem('mybudget_transactions');
        const accountsData = localStorage.getItem('mybudget_accounts');
        const categoriesData = localStorage.getItem('mybudget_categories');

        if (transactionsData) this.transactions.set(JSON.parse(transactionsData));
        if (accountsData) this.accounts.set(JSON.parse(accountsData));
        if (categoriesData) this.categories.set(JSON.parse(categoriesData));
    }

    private initializeDefaultCategories() {
        if (this.categories().length === 0) {
            const defaultCategories: Category[] = [
                { id: this.generateId(), name: 'Lebensmittel', icon: 'shopping_cart', type: 'expense' },
                { id: this.generateId(), name: 'Transport', icon: 'directions_car', type: 'expense' },
                { id: this.generateId(), name: 'Wohnung', icon: 'home', type: 'expense' },
                { id: this.generateId(), name: 'Unterhaltung', icon: 'movie', type: 'expense' },
                { id: this.generateId(), name: 'Gesundheit', icon: 'health_and_safety', type: 'expense' },
                { id: this.generateId(), name: 'Gehalt', icon: 'payments', type: 'income' },
                { id: this.generateId(), name: 'Sonstiges', icon: 'more_horiz', type: 'both' },
                { id: this.generateId(), name: 'Haushalt', icon: 'cottage', type: 'expense' }
            ];
            this.categories.set(defaultCategories);
            this.saveCategories();
        }
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
        const icon = formData.get('categoryIcon') as string;
        const type = (formData.get('categoryType') as 'income' | 'expense' | 'both') || 'both';

        if (this.editingCategory()) {
            const updatedCategory = { ...this.editingCategory()!, name, icon, type };
            this.categories.update(categories =>
                categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
            );
        } else {
            const category: Category = {
                id: this.generateId(),
                name,
                icon,
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
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

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
                this.getCategoryById(t.category)?.name.toLowerCase().includes(query)
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

    getSortedTransactions() {
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
                this.getCategoryById(t.category)?.name.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }

    getCategoryById(id: string): Category | undefined {
        return this.categories().find(c => c.id === id);
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
        input.accept = '.csv';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        input.click();
    }

    private processImportFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const content = e.target.result;
            this.parseAndImportCSV(content);
        };
        reader.readAsText(file);
    }

    private parseAndImportCSV(csv: string) {
        const lines = csv.split('\n');
        const newTransactions: Transaction[] = [];

        // Local maps for batch processing
        // Start with empty accounts to reset them (clean start)
        const accountsMap = new Map<string, Account>();
        // Start with existing categories to preserve icons/ids
        const categoriesMap = new Map<string, Category>();
        this.categories().forEach(c => categoriesMap.set(c.name, c));

        lines.forEach(line => {
            if (!line.trim()) return;

            const parts = line.split(',');
            if (parts.length < 8) return;

            const amountRaw = parseFloat(parts[1]);
            const dateRaw = parts[2].trim().replace(' ', 'T');
            const description = parts[3].trim();
            const accountName = parts[5].trim();
            const categoryName = parts[7].trim();

            // 1. Handle Account
            let account = accountsMap.get(accountName);
            if (!account) {
                account = {
                    id: this.generateId(),
                    name: accountName,
                    balance: 0
                };
                accountsMap.set(accountName, account);
            }

            // Update balance
            account.balance += amountRaw;

            // 2. Handle Category
            let category = categoriesMap.get(categoryName);
            if (!category) {
                category = {
                    id: this.generateId(),
                    name: categoryName,
                    icon: 'category',
                    type: 'both' // Default type for imported categories
                };
                categoriesMap.set(categoryName, category);
            }

            // 3. Create Transaction
            const amount = Math.abs(amountRaw);
            const type: 'income' | 'expense' = amountRaw >= 0 ? 'income' : 'expense';

            const transaction: Transaction = {
                id: this.generateId(),
                type,
                amount,
                description,
                category: category.id,
                account: account.id,
                date: dateRaw.split('T')[0]
            };

            newTransactions.push(transaction);
        });

        if (newTransactions.length > 0) {
            // Set signals with new data (replacing old for transactions/accounts)
            this.transactions.set(newTransactions);
            this.accounts.set(Array.from(accountsMap.values()));
            this.categories.set(Array.from(categoriesMap.values()));

            this.saveTransactions();
            this.saveAccounts();
            this.saveCategories();
        }
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
}
