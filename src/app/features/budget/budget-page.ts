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

export interface TransactionFormData {
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category: string;
    account: string;
    toAccount?: string;
    date: string;
}

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

    // Budget services (public for template access)
    public stateService = inject(BudgetStateService);
    public utilityService = inject(BudgetUtilityService);
    public statsService = inject(BudgetStatsService);

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

    // Track newly created transaction for highlight effect
    newlyCreatedTransactionId = signal<string | null>(null);
    private highlightTimeout: ReturnType<typeof setTimeout> | null = null;

    // Expose Math to template
    Math = Math;

    // Handler instances (public for template access)
    public modalHandlers: BudgetPageModalHandlers;
    public entityHandlers: BudgetPageEntityHandlers;
    public importExportHandlers: BudgetPageImportExportHandlers;

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

        // Close settings modal on route change
        this.router.events.subscribe(() => {
            if (this.showSettingsModal()) {
                this.showSettingsModal.set(false);
            }
        });
    }

    // ==================== Transaction Modal Submit (contains actual logic) ====================

    onTransactionModalSubmit(data: TransactionFormData) {
        const isEditing = !!this.editingTransaction();
        const isFromFixedCost = !!this.prefillFromFixedCost();

        const transactionData = {
            type: data.type,
            amount: data.amount,
            description: data.description,
            category: data.category,
            account: data.account,
            toAccount: data.type === 'transfer' ? data.toAccount : undefined,
            date: data.date
        };

        if (isEditing) {
            const oldTransaction = this.editingTransaction()!;
            this.stateService.updateTransaction(oldTransaction.id, transactionData, oldTransaction);
        } else {
            // Add new transaction and get the created transaction with ID
            const newTransaction = this.stateService.addTransaction(transactionData);
            // Trigger highlight effect for the new transaction
            if (newTransaction && newTransaction.id) {
                this.newlyCreatedTransactionId.set(newTransaction.id);
                // Clear highlight after animation completes
                if (this.highlightTimeout) {
                    clearTimeout(this.highlightTimeout);
                }
                this.highlightTimeout = setTimeout(() => {
                    this.newlyCreatedTransactionId.set(null);
                }, 1500);
            }
        }

        this.showTransactionModal.set(false);
        this.editingTransaction.set(null);
        this.prefillFromFixedCost.set(null);

        if (isFromFixedCost) {
            this.showToast(`Fixkosten "${data.description}" gebucht`);
        } else if (isEditing) {
            this.showToast('Transaktion aktualisiert');
        } else {
            this.showToast('Transaktion hinzugefügt');
        }
    }

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

        this.modalHandlers.toggleFixedCostModal();
    }
}
