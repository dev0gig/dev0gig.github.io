import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppsLauncher } from '../../shared/apps-launcher/apps-launcher';
import { ThemeService } from '../../shared/theme.service';
import { SidebarService } from '../../shared/sidebar.service';
import { SettingsService } from '../../shared/settings.service';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from './budget.models';
import { BudgetStateService } from './budget.state.service';
import { BudgetUtilityService } from './budget.utility.service';
import { BudgetStatsService } from './budget.stats.service';

// Sub-components
import {
    TransactionsViewComponent,
    StatisticsViewComponent,
    FixedCostsViewComponent,
    BudgetSidebarComponent,
    TransactionModalComponent,
    AccountModalComponent,
    CategoryModalComponent,
    FixedCostModalComponent,
    SettingsModalComponent
} from './components';
import { FixedCostGroupModalComponent } from './components/modals/fixed-cost-group-modal/fixed-cost-group-modal';

@Component({
    selector: 'app-budget-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AppsLauncher,
        // View components
        TransactionsViewComponent,
        StatisticsViewComponent,
        FixedCostsViewComponent,
        BudgetSidebarComponent,
        TransactionModalComponent,
        AccountModalComponent,
        CategoryModalComponent,
        FixedCostModalComponent,
        SettingsModalComponent,
        FixedCostGroupModalComponent
    ],
    templateUrl: './budget-page.html',
    styleUrls: ['./budget-page.css']
})
export class BudgetPage {
    // External services (must remain unchanged as per requirements)
    themeService = inject(ThemeService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    router = inject(Router);

    // New Budget services
    stateService = inject(BudgetStateService);
    utilityService = inject(BudgetUtilityService);
    statsService = inject(BudgetStatsService);

    // Online status
    isOnline = signal(true);

    // UI State signals
    showTransactionModal = signal(false);
    showAccountModal = signal(false);
    showCategoryModal = signal(false);
    showSettingsModal = signal(false);
    showFixedCostModal = signal(false);
    showFixedCostGroupModal = signal(false);

    settingsView = signal<'main' | 'accounts' | 'categories'>('main');
    viewMode = signal<'transactions' | 'statistics' | 'fixedcosts'>('transactions');

    // Editing state signals
    editingCategory = signal<Category | null>(null);
    editingFixedCost = signal<FixedCost | null>(null);
    editingTransaction = signal<Transaction | null>(null);
    editingAccount = signal<Account | null>(null);
    editingFixedCostGroup = signal<FixedCostGroup | null>(null);

    // For pre-filling transaction from fixed cost
    prefillFromFixedCost = signal<FixedCost | null>(null);

    // Transaction type for modals
    currentTransactionType = signal<'income' | 'expense' | 'transfer'>('expense');

    // Inline editing
    expandedTransactionId = signal<string | null>(null);
    inlineEditingTransactionId = signal<string | null>(null);
    inlineTransactionTypes = signal<Map<string, 'income' | 'expense' | 'transfer'>>(new Map());

    // Toast notification
    toastMessage = signal<string | null>(null);
    private toastTimeout: ReturnType<typeof setTimeout> | null = null;

    // Expose Math to template
    Math = Math;

    constructor() {
        window.addEventListener('blur', () => this.isOnline.set(false));
        window.addEventListener('focus', () => this.isOnline.set(true));

        // Close settings modal on route change
        this.router.events.subscribe(() => {
            if (this.showSettingsModal()) {
                this.showSettingsModal.set(false);
            }
        });

        // Listen to settings service trigger
        let previousTrigger = this.settingsService.trigger();
        effect(() => {
            const trigger = this.settingsService.trigger();
            if (trigger > previousTrigger) {
                this.showSettingsModal.set(true);
                previousTrigger = trigger;
            }
        });
    }

    // ==================== Passthrough methods for template ====================
    // These delegate to services while maintaining the same API in the template

    // State service delegations
    get transactions() { return this.stateService.transactions; }
    get accounts() { return this.stateService.accounts; }
    get categories() { return this.stateService.categories; }
    get fixedCosts() { return this.stateService.fixedCosts; }
    get fixedCostGroups() { return this.stateService.fixedCostGroups; }
    get selectedAccountId() { return this.stateService.selectedAccountId; }
    get searchQuery() { return this.stateService.searchQuery; }
    get selectedMonth() { return this.stateService.selectedMonth; }

    getCategoryById(id: string) { return this.stateService.getCategoryById(id); }
    getCategoryFullName(id: string) { return this.stateService.getCategoryFullName(id); }
    getSortedCategories() { return this.stateService.getSortedCategories(); }
    getAccountById(id: string) { return this.stateService.getAccountById(id); }
    getTotalBalance() { return this.stateService.getTotalBalance(); }
    getFilteredTransactions() { return this.stateService.getFilteredTransactions(); }
    getSortedTransactions() { return this.stateService.getSortedTransactions(); }
    getFixedCosts() { return this.stateService.getFixedCosts(); }
    getFixedCostsSortedByCategory() { return this.stateService.getFixedCostsSortedByCategory(); }
    getFixedCostsTotal() { return this.stateService.getFixedCostsTotal(); }
    getFixedIncomeTotal() { return this.stateService.getFixedIncomeTotal(); }
    getFixedTransferTotal() { return this.stateService.getFixedTransferTotal(); }
    getFixedIncomeCount() { return this.stateService.getFixedIncomeCount(); }
    getFixedExpenseCount() { return this.stateService.getFixedExpenseCount(); }
    getFixedTransferCount() { return this.stateService.getFixedTransferCount(); }
    getExcludedFixedCostsTotal() { return this.stateService.getExcludedFixedCostsTotal(); }
    getExcludedFixedCostsCount() { return this.stateService.getExcludedFixedCostsCount(); }
    getFixedCostsSortedByOrder() { return this.stateService.getFixedCostsSortedByOrder(); }
    getFixedCostGroupsSortedByOrder() { return this.stateService.getFixedCostGroupsSortedByOrder(); }

    // Utility service delegations
    formatCurrency(amount: number) { return this.utilityService.formatCurrency(amount); }
    formatDate(dateStr: string) { return this.utilityService.formatDate(dateStr); }
    getTodayDateString() { return this.utilityService.getTodayDateString(); }

    // Stats service delegations
    getStats() { return this.statsService.getStats(); }
    getCategoryStats() { return this.statsService.getCategoryStats(); }
    getIncomeCategoryStats() { return this.statsService.getIncomeCategoryStats(); }
    getDailyTrend() { return this.statsService.getDailyTrend(); }
    getPieChartGradient() { return this.statsService.getPieChartGradient(); }
    getIncomePieChartGradient() { return this.statsService.getIncomePieChartGradient(); }
    getTrendPoints() { return this.statsService.getTrendPoints(); }
    getTrendAreaPoints() { return this.statsService.getTrendAreaPoints(); }
    getTrendMaxValue() { return this.statsService.getTrendMaxValue(); }
    getTrendMinValue() { return this.statsService.getTrendMinValue(); }
    getZeroLineY() { return this.statsService.getZeroLineY(); }
    getDaysInSelectedMonth() { return this.statsService.getDaysInSelectedMonth(); }
    getSelectedMonthName() { return this.statsService.getSelectedMonthName(); }
    getIncomeTransactionCount() { return this.statsService.getIncomeTransactionCount(); }
    getExpenseTransactionCount() { return this.statsService.getExpenseTransactionCount(); }
    getTopExpenses() { return this.statsService.getTopExpenses(); }
    getAverageDailyExpense() { return this.statsService.getAverageDailyExpense(); }
    getAverageDailyIncome() { return this.statsService.getAverageDailyIncome(); }
    getLargestExpense() { return this.statsService.getLargestExpense(); }
    getLargestIncome() { return this.statsService.getLargestIncome(); }

    // ==================== UI Toggle Methods ====================

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
        if (!this.showSettingsModal()) {
            this.settingsView.set('main');
        }
    }

    toggleRightSidebar() {
        this.sidebarService.toggleRight();
    }

    toggleTransactionModal() {
        this.showTransactionModal.set(!this.showTransactionModal());
    }

    toggleAccountModal() {
        this.showAccountModal.set(!this.showAccountModal());
    }

    toggleCategoryModal() {
        const newState = !this.showCategoryModal();
        console.log('[BudgetPage] toggleCategoryModal called, new state:', newState, 'editingCategory:', this.editingCategory());
        this.showCategoryModal.set(newState);
    }

    toggleFixedCostModal() {
        this.showFixedCostModal.set(!this.showFixedCostModal());
        if (!this.showFixedCostModal()) {
            this.editingFixedCost.set(null);
        }
    }

    toggleViewMode(mode: 'transactions' | 'statistics' | 'fixedcosts') {
        this.viewMode.set(mode);
    }

    setTransactionType(type: 'income' | 'expense' | 'transfer') {
        this.currentTransactionType.set(type);
    }

    // ==================== Transaction Modal Methods ====================

    openNewTransactionModal() {
        this.editingTransaction.set(null);
        this.prefillFromFixedCost.set(null);
        this.showTransactionModal.set(true);
    }

    openEditTransactionModal(transaction: Transaction) {
        this.editingTransaction.set(transaction);
        this.prefillFromFixedCost.set(null);
        this.currentTransactionType.set(transaction.type);
        this.showTransactionModal.set(true);
    }

    openNewFixedCostModal() {
        this.editingFixedCost.set(null);
        this.showFixedCostModal.set(true);
    }

    openEditFixedCostModalUnified(fixedCost: FixedCost) {
        this.editingFixedCost.set(fixedCost);
        this.showFixedCostModal.set(true);
    }

    openBookFixedCostModal(fixedCost: FixedCost) {
        this.prefillFromFixedCost.set(fixedCost);
        this.editingTransaction.set(null);
        this.currentTransactionType.set(fixedCost.type);
        this.showTransactionModal.set(true);
    }



    // ==================== Account Methods ====================

    selectAccount(id: string | null) {
        this.stateService.selectAccount(id);
    }

    openEditAccountModal(account: Account) {
        this.editingAccount.set(account);
        this.showAccountModal.set(true);
    }

    deleteAccount(id: string) {
        if (confirm('Möchten Sie dieses Konto wirklich löschen?')) {
            this.stateService.deleteAccount(id);
        }
    }

    onAccountSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('accountName') as string;
        const balance = parseFloat(formData.get('accountBalance') as string);

        if (this.editingAccount()) {
            this.stateService.updateAccount(this.editingAccount()!.id, name, balance);
        } else {
            this.stateService.addAccount(name, balance);
        }

        this.toggleAccountModal();
        this.editingAccount.set(null);
        form.reset();
    }

    // ==================== Category Methods ====================

    openEditCategoryModal(category: Category) {
        console.log('[BudgetPage] openEditCategoryModal called with:', category);
        this.editingCategory.set(category);
        this.showCategoryModal.set(true);
    }

    deleteCategory(id: string) {
        if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
            this.stateService.deleteCategory(id);
        }
    }

    deleteAllCategories() {
        console.log('[BudgetPage] deleteAllCategories called');
        console.log('[BudgetPage] Categories BEFORE delete:', JSON.stringify(this.stateService.categories()));
        this.stateService.deleteAllCategories();
        console.log('[BudgetPage] Categories AFTER delete:', JSON.stringify(this.stateService.categories()));
        this.showToast('Alle Kategorien gelöscht');
    }

    deleteSelectedCategories(ids: string[]) {
        console.log('[BudgetPage] deleteSelectedCategories called with ids:', ids);
        console.log('[BudgetPage] Categories BEFORE delete:', JSON.stringify(this.stateService.categories()));
        this.stateService.deleteSelectedCategories(ids);
        console.log('[BudgetPage] Categories AFTER delete:', JSON.stringify(this.stateService.categories()));
        this.showToast(`${ids.length} Kategorien gelöscht`);
    }

    onCategorySubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('categoryName') as string;
        const type = (formData.get('categoryType') as 'income' | 'expense' | 'both') || 'both';

        if (this.editingCategory()) {
            this.stateService.updateCategory(this.editingCategory()!.id, name, type);
        } else {
            this.stateService.addCategory(name, type);
        }

        this.toggleCategoryModal();
        this.editingCategory.set(null);
        form.reset();
    }

    // ==================== Transaction Methods ====================

    toggleExpansion(id: string) {
        if (this.expandedTransactionId() === id) {
            this.expandedTransactionId.set(null);
        } else {
            this.expandedTransactionId.set(id);
        }
    }

    deleteTransaction(id: string) {
        if (confirm('Möchten Sie diese Transaktion wirklich löschen?')) {
            this.stateService.deleteTransaction(id);
        }
    }

    deleteAllTransactions() {
        if (confirm('Sind Sie sicher, dass Sie ALLE Transaktionen löschen möchten? Dies kann nicht rückgängig gemacht werden.')) {
            this.stateService.deleteAllTransactions();
        }
    }

    openEditModal(transaction: Transaction) {
        this.editingTransaction.set(transaction);
        this.currentTransactionType.set(transaction.type);
        this.showTransactionModal.set(true);
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

        const transactionData = {
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
            this.stateService.updateTransaction(oldTransaction.id, transactionData, oldTransaction);
        } else {
            this.stateService.addTransaction(transactionData);
        }

        this.toggleTransactionModal();
        form.reset();
        this.editingTransaction.set(null);
        this.prefillFromFixedCost.set(null);
        this.setTodayDate();
    }

    private setTodayDate() {
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }, 0);
    }

    // ==================== Inline Editing Methods ====================

    toggleInlineEdit(transactionId: string) {
        if (this.inlineEditingTransactionId() === transactionId) {
            this.inlineEditingTransactionId.set(null);
        } else {
            const transaction = this.stateService.transactions().find(t => t.id === transactionId);
            if (transaction) {
                this.inlineEditingTransactionId.set(transactionId);
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
        const transaction = this.stateService.transactions().find(t => t.id === transactionId);
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

        const oldTransaction = this.stateService.transactions().find(t => t.id === transactionId);
        if (!oldTransaction) return;

        const transactionData = {
            type,
            amount,
            description,
            category: categoryId,
            account: accountId,
            toAccount: type === 'transfer' ? toAccountId : undefined,
            date
        };

        this.stateService.updateTransaction(transactionId, transactionData, oldTransaction);
        this.cancelInlineEdit(transactionId);
    }

    // ==================== Fixed Cost Methods ====================

    openEditFixedCostModal(fixedCost: FixedCost) {
        this.editingFixedCost.set(fixedCost);
        this.showFixedCostModal.set(true);
    }

    deleteFixedCost(id: string) {
        if (confirm('Möchten Sie diese Fixkosten wirklich löschen?')) {
            this.stateService.deleteFixedCost(id);
        }
    }

    onFixedCostSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const data = {
            name: formData.get('fixedCostName') as string,
            amount: parseFloat(formData.get('fixedCostAmount') as string),
            type: formData.get('fixedCostType') as 'income' | 'expense' | 'transfer',
            category: formData.get('fixedCostCategory') as string,
            account: formData.get('fixedCostAccount') as string,
            toAccount: formData.get('fixedCostToAccount') as string || undefined,
            groupId: formData.get('fixedCostGroup') as string || undefined,
            note: formData.get('fixedCostNote') as string || undefined,
            excludeFromTotal: (formData.get('fixedCostExclude') as string) === 'on'
        };

        if (this.editingFixedCost()) {
            this.stateService.updateFixedCost(this.editingFixedCost()!.id, data);
        } else {
            this.stateService.addFixedCost(data);
        }

        this.toggleFixedCostModal();
        form.reset();
    }

    createTransactionFromFixedCost(fixedCost: FixedCost) {
        this.prefillFromFixedCost.set(fixedCost);
        this.currentTransactionType.set(fixedCost.type);
        this.showTransactionModal.set(true);

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
        this.stateService.copyTransactionToFixedCost(transaction);
        alert(`"${transaction.description}" wurde als Fixkosten gespeichert.`);
    }

    // ==================== Search & Filter ====================

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.stateService.onSearch(input.value);
    }

    onMonthChange(date: Date) {
        this.stateService.onMonthChange(date);
    }

    // ==================== Import/Export ====================

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

        if (jsonData.version === 2 && jsonData.transaktionen) {
            const result = this.stateService.importExtendedFormat(jsonData);
            alert(`Import erfolgreich:\n- ${result.transactions} Transaktionen\n- ${result.fixedCosts} Fixkosten`);
        } else if (Array.isArray(jsonData)) {
            const count = this.stateService.importLegacyFormat(jsonData);
            if (count > 0) {
                alert(`${count} Transaktionen erfolgreich importiert.`);
            } else {
                alert('Keine gültigen Transaktionen in der Datei gefunden.');
            }
        } else {
            alert('Unbekanntes Dateiformat. Bitte überprüfen Sie die JSON-Datei.');
        }
    }

    triggerExport() {
        const transactions = this.stateService.transactions();
        const fixedCosts = this.stateService.fixedCosts();

        if (transactions.length === 0 && fixedCosts.length === 0) {
            alert('Keine Daten zum Exportieren vorhanden.');
            return;
        }

        const exportData = this.stateService.getExportData();
        const jsonContent = JSON.stringify(exportData, null, 2);

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

    // ==================== Modal Submit Handlers (for sub-components) ====================

    onTransactionModalSubmit(data: {
        type: 'income' | 'expense' | 'transfer';
        amount: number;
        description: string;
        category: string;
        account: string;
        date: string;
        toAccount?: string;
    }) {
        const transactionData = {
            type: data.type,
            amount: data.amount,
            description: data.description,
            category: data.category,
            account: data.account,
            toAccount: data.type === 'transfer' ? data.toAccount : undefined,
            date: data.date
        };

        const isEditing = !!this.editingTransaction();
        const isFromFixedCost = !!this.prefillFromFixedCost();

        if (isEditing) {
            const oldTransaction = this.editingTransaction()!;
            this.stateService.updateTransaction(oldTransaction.id, transactionData, oldTransaction);
        } else {
            this.stateService.addTransaction(transactionData);
        }

        // Close modal immediately
        this.showTransactionModal.set(false);
        this.editingTransaction.set(null);
        this.prefillFromFixedCost.set(null);

        // Show confirmation toast
        if (isFromFixedCost) {
            this.showToast(`Fixkosten "${data.description}" gebucht`);
        } else if (isEditing) {
            this.showToast('Transaktion aktualisiert');
        } else {
            this.showToast('Transaktion hinzugefügt');
        }
    }

    onAccountModalSubmit(data: { name: string; balance: number }) {
        if (this.editingAccount()) {
            this.stateService.updateAccount(this.editingAccount()!.id, data.name, data.balance);
        } else {
            this.stateService.addAccount(data.name, data.balance);
        }

        this.toggleAccountModal();
        this.editingAccount.set(null);
    }

    onCategoryModalSubmit(data: { name: string; type: 'income' | 'expense' | 'both' }) {
        console.log('========================================');
        console.log('[BudgetPage] onCategoryModalSubmit CALLED');
        console.log('[BudgetPage] Data received:', JSON.stringify(data));

        // CRITICAL: Validate that we received actual category data, not a native Event
        if (!data || typeof data.name !== 'string' || !['income', 'expense', 'both'].includes(data.type)) {
            console.log('[BudgetPage] ERROR: Invalid data received (likely native form event), ignoring');
            return;
        }

        console.log('[BudgetPage] editingCategory is:', this.editingCategory());
        console.log('[BudgetPage] Categories BEFORE operation:', JSON.stringify(this.stateService.categories()));

        if (this.editingCategory()) {
            console.log('[BudgetPage] MODE: Updating existing category ID:', this.editingCategory()!.id);
            this.stateService.updateCategory(this.editingCategory()!.id, data.name, data.type);
        } else {
            console.log('[BudgetPage] MODE: Adding NEW category');
            this.stateService.addCategory(data.name, data.type);
        }

        console.log('[BudgetPage] Categories AFTER operation:', JSON.stringify(this.stateService.categories()));
        console.log('========================================');

        this.toggleCategoryModal();
        this.editingCategory.set(null);
    }

    onFixedCostModalSubmit(data: {
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
        if (this.editingFixedCost()) {
            this.stateService.updateFixedCost(this.editingFixedCost()!.id, data);
        } else {
            this.stateService.addFixedCost(data);
        }

        this.toggleFixedCostModal();
    }

    // ==================== Fixed Cost Group Methods ====================

    toggleFixedCostGroupModal() {
        this.showFixedCostGroupModal.set(!this.showFixedCostGroupModal());
        if (!this.showFixedCostGroupModal()) {
            this.editingFixedCostGroup.set(null);
        }
    }

    openEditFixedCostGroupModal(group: FixedCostGroup) {
        this.editingFixedCostGroup.set(group);
        this.showFixedCostGroupModal.set(true);
    }

    deleteFixedCostGroup(id: string) {
        if (confirm('Möchten Sie diese Gruppe wirklich löschen? Die Fixkosten bleiben erhalten.')) {
            this.stateService.deleteFixedCostGroup(id);
        }
    }

    onFixedCostGroupModalSubmit(data: { name: string }) {
        const isEditing = !!this.editingFixedCostGroup();

        if (isEditing) {
            this.stateService.updateFixedCostGroup(this.editingFixedCostGroup()!.id, data.name);
            this.showToast(`Gruppe "${data.name}" aktualisiert`);
        } else {
            this.stateService.addFixedCostGroup(data.name);
            this.showToast(`Gruppe "${data.name}" erstellt - verschiebe jetzt Fixkosten in die Gruppe`);
        }

        // Explicitly close the modal
        this.showFixedCostGroupModal.set(false);
        this.editingFixedCostGroup.set(null);
    }

    showToast(message: string) {
        // Clear any existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toastMessage.set(message);

        // Auto-hide after 5 seconds
        this.toastTimeout = setTimeout(() => {
            this.toastMessage.set(null);
        }, 5000);
    }

    hideToast() {
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        this.toastMessage.set(null);
    }

    reorderFixedCosts(ids: string[]) {
        this.stateService.reorderFixedCosts(ids);
    }

    deleteAllFixedCostGroups() {
        if (confirm('Möchten Sie wirklich ALLE Gruppen löschen? Die Fixkosten bleiben erhalten.')) {
            this.stateService.deleteAllFixedCostGroups();
            this.showToast('Alle Gruppen gelöscht');
        }
    }

    deleteSelectedFixedCostGroups(ids: string[]) {
        if (confirm(`Möchten Sie die ${ids.length} ausgewählten Gruppen wirklich löschen?`)) {
            this.stateService.deleteSelectedFixedCostGroups(ids);
            this.showToast(`${ids.length} Gruppen gelöscht`);
        }
    }

    reorderFixedCostGroups(ids: string[]) {
        this.stateService.reorderFixedCostGroups(ids);
    }
}
