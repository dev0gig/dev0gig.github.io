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

// Handler classes
import { BudgetPageModalHandlers } from './budget-page-modal-handlers';
import { BudgetPageEntityHandlers } from './budget-page-entity-handlers';
import { BudgetPageImportExportHandlers } from './budget-page-import-export-handlers';

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
    // External services
    themeService = inject(ThemeService);
    sidebarService = inject(SidebarService);
    settingsService = inject(SettingsService);
    router = inject(Router);

    // Budget services
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

    // Handler instances
    private modalHandlers: BudgetPageModalHandlers;
    private entityHandlers: BudgetPageEntityHandlers;
    private importExportHandlers: BudgetPageImportExportHandlers;

    constructor() {
        // Initialize handlers
        this.modalHandlers = new BudgetPageModalHandlers(
            this.stateService,
            this.showTransactionModal,
            this.showAccountModal,
            this.showCategoryModal,
            this.showSettingsModal,
            this.showFixedCostModal,
            this.showFixedCostGroupModal,
            this.settingsView,
            this.editingCategory,
            this.editingFixedCost,
            this.editingTransaction,
            this.editingAccount,
            this.editingFixedCostGroup,
            this.prefillFromFixedCost,
            this.currentTransactionType,
            this.showToast.bind(this)
        );

        this.entityHandlers = new BudgetPageEntityHandlers(
            this.stateService,
            this.expandedTransactionId,
            this.inlineEditingTransactionId,
            this.inlineTransactionTypes,
            this.currentTransactionType,
            this.prefillFromFixedCost,
            this.showTransactionModal,
            this.showToast.bind(this)
        );

        this.importExportHandlers = new BudgetPageImportExportHandlers(this.stateService);

        // Event listeners
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

    // ==================== Modal Handler Delegations ====================

    toggleSettingsModal() { this.modalHandlers.toggleSettingsModal(); }
    toggleTransactionModal() { this.modalHandlers.toggleTransactionModal(); }
    toggleAccountModal() { this.modalHandlers.toggleAccountModal(); }
    toggleCategoryModal() { this.modalHandlers.toggleCategoryModal(); }
    toggleFixedCostModal() { this.modalHandlers.toggleFixedCostModal(); }
    toggleFixedCostGroupModal() { this.modalHandlers.toggleFixedCostGroupModal(); }

    openNewTransactionModal() { this.modalHandlers.openNewTransactionModal(); }
    openEditTransactionModal(transaction: Transaction) { this.modalHandlers.openEditTransactionModal(transaction); }
    openNewFixedCostModal() { this.modalHandlers.openNewFixedCostModal(); }
    openEditFixedCostModalUnified(fixedCost: FixedCost) { this.modalHandlers.openEditFixedCostModalUnified(fixedCost); }
    openBookFixedCostModal(fixedCost: FixedCost) { this.modalHandlers.openBookFixedCostModal(fixedCost); }
    openEditAccountModal(account: Account) { this.modalHandlers.openEditAccountModal(account); }
    openEditCategoryModal(category: Category) { this.modalHandlers.openEditCategoryModal(category); }
    openEditFixedCostModal(fixedCost: FixedCost) { this.modalHandlers.openEditFixedCostModal(fixedCost); }
    openEditFixedCostGroupModal(group: FixedCostGroup) { this.modalHandlers.openEditFixedCostGroupModal(group); }

    onTransactionModalSubmit(data: any) { this.modalHandlers.onTransactionModalSubmit(data); }
    onAccountModalSubmit(data: { name: string; balance: number }) { this.modalHandlers.onAccountModalSubmit(data); }
    onCategoryModalSubmit(data: { name: string; type: 'income' | 'expense' | 'both' }) { this.modalHandlers.onCategoryModalSubmit(data); }
    onFixedCostModalSubmit(data: any) { this.modalHandlers.onFixedCostModalSubmit(data); }
    onFixedCostGroupModalSubmit(data: { name: string }) { this.modalHandlers.onFixedCostGroupModalSubmit(data); }

    // ==================== Entity Handler Delegations ====================

    selectAccount(id: string | null) { this.entityHandlers.selectAccount(id); }
    deleteAccount(id: string) { this.entityHandlers.deleteAccount(id); }
    deleteCategory(id: string) { this.entityHandlers.deleteCategory(id); }
    deleteAllCategories() { this.entityHandlers.deleteAllCategories(); }
    deleteSelectedCategories(ids: string[]) { this.entityHandlers.deleteSelectedCategories(ids); }
    loadDefaultCategories() { return this.entityHandlers.loadDefaultCategories(); }

    toggleExpansion(id: string) { this.entityHandlers.toggleExpansion(id); }
    deleteTransaction(id: string) { this.entityHandlers.deleteTransaction(id); }
    deleteAllTransactions() { this.entityHandlers.deleteAllTransactions(); }

    toggleInlineEdit(transactionId: string) { this.entityHandlers.toggleInlineEdit(transactionId); }
    cancelInlineEdit(transactionId: string) { this.entityHandlers.cancelInlineEdit(transactionId); }
    isEditingInline(transactionId: string) { return this.entityHandlers.isEditingInline(transactionId); }
    setInlineTransactionType(transactionId: string, type: 'income' | 'expense' | 'transfer') {
        this.entityHandlers.setInlineTransactionType(transactionId, type);
    }
    getInlineTransactionType(transactionId: string) { return this.entityHandlers.getInlineTransactionType(transactionId); }
    onInlineTransactionEdit(event: Event, transactionId: string) { this.entityHandlers.onInlineTransactionEdit(event, transactionId); }

    deleteFixedCost(id: string) { this.entityHandlers.deleteFixedCost(id); }
    createTransactionFromFixedCost(fixedCost: FixedCost) { this.entityHandlers.createTransactionFromFixedCost(fixedCost); }
    clearPrefillData() { this.entityHandlers.clearPrefillData(); }
    copyTransactionToFixedCost(transaction: Transaction) { this.entityHandlers.copyTransactionToFixedCost(transaction); }

    deleteFixedCostGroup(id: string) { this.entityHandlers.deleteFixedCostGroup(id); }
    reorderFixedCosts(ids: string[]) { this.entityHandlers.reorderFixedCosts(ids); }
    deleteAllFixedCostGroups() { this.entityHandlers.deleteAllFixedCostGroups(); }
    deleteSelectedFixedCostGroups(ids: string[]) { this.entityHandlers.deleteSelectedFixedCostGroups(ids); }
    reorderFixedCostGroups(ids: string[]) { this.entityHandlers.reorderFixedCostGroups(ids); }

    // ==================== Import/Export Delegations ====================

    triggerImport() { this.importExportHandlers.triggerImport(); }
    triggerExport() { this.importExportHandlers.triggerExport(); }

    // ==================== UI Methods ====================

    toggleRightSidebar() {
        this.sidebarService.toggleRight();
    }

    toggleViewMode(mode: 'transactions' | 'statistics' | 'fixedcosts') {
        this.viewMode.set(mode);
    }

    setTransactionType(type: 'income' | 'expense' | 'transfer') {
        this.currentTransactionType.set(type);
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.stateService.onSearch(input.value);
    }

    onMonthChange(date: Date) {
        this.stateService.onMonthChange(date);
    }

    showToast(message: string) {
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        this.toastMessage.set(message);
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

    // ==================== Legacy Form Handlers (for backwards compatibility) ====================

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

    openEditModal(transaction: Transaction) {
        this.editingTransaction.set(transaction);
        this.currentTransactionType.set(transaction.type);
        this.showTransactionModal.set(true);
        setTimeout(() => {
            const dateInput = document.getElementById('transactionDate') as HTMLInputElement;
            if (dateInput) dateInput.value = transaction.date;
        }, 0);
    }

    onFixedCostSubmit(data: {
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
}
