// Data Storage
class BudgetApp {
    constructor() {
        this.transactions = this.loadData('transactions') || [];
        this.accounts = this.loadData('accounts') || [];
        this.categories = this.loadData('categories') || this.getDefaultCategories();
        this.currentTransactionType = 'expense';
        this.editingTransactionId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderAll();
        this.setTodayDate();
    }

    // Default Categories
    getDefaultCategories() {
        return [
            { id: this.generateId(), name: 'Lebensmittel', icon: 'shopping_cart' },
            { id: this.generateId(), name: 'Transport', icon: 'directions_car' },
            { id: this.generateId(), name: 'Wohnung', icon: 'home' },
            { id: this.generateId(), name: 'Unterhaltung', icon: 'movie' },
            { id: this.generateId(), name: 'Gesundheit', icon: 'health_and_safety' },
            { id: this.generateId(), name: 'Gehalt', icon: 'payments' },
            { id: this.generateId(), name: 'Sonstiges', icon: 'more_horiz' }
        ];
    }

    // Event Listeners
    setupEventListeners() {
        // Transaction Modal
        document.getElementById('addTransactionBtn').addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Type Toggle
        document.getElementById('expenseBtn').addEventListener('click', () => {
            this.currentTransactionType = 'expense';
            document.getElementById('expenseBtn').className = 'flex-1 bg-dash-accent text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors';
            document.getElementById('incomeBtn').className = 'flex-1 bg-dash-bg text-dash-text-dim px-4 py-2 rounded-sm text-sm font-medium transition-colors border border-dash-border';
        });

        document.getElementById('incomeBtn').addEventListener('click', () => {
            this.currentTransactionType = 'income';
            document.getElementById('incomeBtn').className = 'flex-1 bg-dash-accent text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors';
            document.getElementById('expenseBtn').className = 'flex-1 bg-dash-bg text-dash-text-dim px-4 py-2 rounded-sm text-sm font-medium transition-colors border border-dash-border';
        });

        // Account Modal
        document.getElementById('addAccountBtn').addEventListener('click', () => {
            this.openModal('accountModal');
        });

        document.getElementById('accountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });

        // Category Modal
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.openModal('categoryModal');
        });

        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
    }

    // Render All
    renderAll() {
        this.renderStats();
        this.renderTransactionsList();
        this.updateFilterOptions();
    }

    // Render Stats
    renderStats() {
        const stats = this.calculateStats();

        // Update balance
        document.getElementById('totalBalance').textContent = this.formatCurrency(stats.balance);

        // Update income
        document.getElementById('totalIncome').textContent = this.formatCurrency(stats.income);

        // Update expenses
        document.getElementById('totalExpenses').textContent = this.formatCurrency(stats.expenses);

        // Update transaction count
        document.getElementById('transactionCount').textContent = this.transactions.length;

        // Update balance change
        const changePercent = stats.lastMonthBalance !== 0
            ? ((stats.balance - stats.lastMonthBalance) / Math.abs(stats.lastMonthBalance) * 100).toFixed(2)
            : 0;

        document.getElementById('balanceChange').textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
    }

    // Calculate Statistics
    calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthTransactions = this.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const lastMonth = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthTransactions = this.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
        });

        const income = thisMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = thisMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        const lastMonthIncome = lastMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = lastMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthBalance = lastMonthIncome - lastMonthExpenses;

        return { balance, income, expenses, lastMonthBalance };
    }

    // Render Transactions List
    renderTransactionsList() {
        const container = document.getElementById('transactionsList');
        const sortedTransactions = [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-dash-text-dim">
                    <span class="material-symbols-sharp text-4xl opacity-50 block mb-2">receipt_long</span>
                    <p>Keine Transaktionen vorhanden</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedTransactions.map(t => this.createTransactionHTML(t)).join('');
    }

    // Create Transaction HTML
    createTransactionHTML(transaction) {
        const category = this.categories.find(c => c.id === transaction.category);
        const account = this.accounts.find(a => a.id === transaction.account);
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const amountColor = transaction.type === 'income' ? 'text-green-500' : 'text-red-500';
        const amountSign = transaction.type === 'income' ? '+' : '-';

        return `
            <div class="bg-dash-bg border border-dash-border p-4 rounded-sm hover:bg-dash-card-hover transition-colors flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-dash-card border border-dash-border rounded-sm flex items-center justify-center">
                        <span class="material-symbols-sharp text-dash-accent">${category?.icon || 'category'}</span>
                    </div>
                    <div>
                        <div class="font-medium text-dash-text">${transaction.description}</div>
                        <div class="text-xs text-dash-text-dim">${category?.name || 'Unbekannt'} • ${account?.name || 'Unbekannt'} • ${formattedDate}</div>
                    </div>
                </div>
                <div class="text-lg font-bold ${amountColor}">
                    ${amountSign}${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    }

    // Update Filter Options
    updateFilterOptions() {
        // Update category select
        const categorySelect = document.getElementById('category');
        const categoryOptions = this.categories.map(c =>
            `<option value="${c.id}">${c.name}</option>`
        ).join('');
        categorySelect.innerHTML = '<option value="">Kategorie wählen</option>' + categoryOptions;

        // Update account select
        const accountSelect = document.getElementById('account');
        const accountOptions = this.accounts.map(a =>
            `<option value="${a.id}">${a.name}</option>`
        ).join('');
        accountSelect.innerHTML = '<option value="">Konto wählen</option>' + accountOptions;
    }

    // Modal Functions
    openTransactionModal() {
        this.editingTransactionId = null;
        document.getElementById('transactionForm').reset();
        this.setTodayDate();
        this.currentTransactionType = 'expense';
        document.getElementById('expenseBtn').className = 'flex-1 bg-dash-accent text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors';
        document.getElementById('incomeBtn').className = 'flex-1 bg-dash-bg text-dash-text-dim px-4 py-2 rounded-sm text-sm font-medium transition-colors border border-dash-border';
        this.openModal('transactionModal');
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // Save Transaction
    saveTransaction() {
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const account = document.getElementById('account').value;
        const date = document.getElementById('date').value;

        const transaction = {
            id: this.editingTransactionId || this.generateId(),
            type: this.currentTransactionType,
            amount,
            description,
            category,
            account,
            date
        };

        if (this.editingTransactionId) {
            const index = this.transactions.findIndex(t => t.id === this.editingTransactionId);
            this.transactions[index] = transaction;
        } else {
            this.transactions.push(transaction);
        }

        this.saveData('transactions', this.transactions);
        this.renderAll();
        this.closeModal('transactionModal');
    }

    // Save Account
    saveAccount() {
        const name = document.getElementById('accountName').value;
        const balance = parseFloat(document.getElementById('accountBalance').value);

        const account = {
            id: this.generateId(),
            name,
            balance
        };

        this.accounts.push(account);
        this.saveData('accounts', this.accounts);
        this.renderAll();
        this.closeModal('accountModal');
        document.getElementById('accountForm').reset();
    }

    // Save Category
    saveCategory() {
        const name = document.getElementById('categoryName').value;
        const icon = document.getElementById('categoryIcon').value;

        const category = {
            id: this.generateId(),
            name,
            icon
        };

        this.categories.push(category);
        this.saveData('categories', this.categories);
        this.renderAll();
        this.closeModal('categoryModal');
        document.getElementById('categoryForm').reset();
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    // Local Storage
    saveData(key, data) {
        localStorage.setItem(`mybudget_${key}`, JSON.stringify(data));
    }

    loadData(key) {
        const data = localStorage.getItem(`mybudget_${key}`);
        return data ? JSON.parse(data) : null;
    }
}

// Global Functions (for onclick handlers)
function closeModal(modalId) {
    app.closeModal(modalId);
}

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BudgetApp();
});
