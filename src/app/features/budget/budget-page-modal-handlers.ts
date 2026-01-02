import { signal } from '@angular/core';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from './budget.models';
import { BudgetStateService } from './budget.state.service';
import { ToastService } from '../../shared/toast.service';

/**
 * Budget Page Modal Handlers - Manages modal state and entity editing
 */
export class BudgetPageModalHandlers {

    constructor(
        private stateService: BudgetStateService,
        public showTransactionModal: ReturnType<typeof signal<boolean>>,
        public showAccountModal: ReturnType<typeof signal<boolean>>,
        public showCategoryModal: ReturnType<typeof signal<boolean>>,
        public showSettingsModal: ReturnType<typeof signal<boolean>>,
        public showFixedCostModal: ReturnType<typeof signal<boolean>>,
        public showFixedCostGroupModal: ReturnType<typeof signal<boolean>>,
        public settingsView: ReturnType<typeof signal<'main' | 'accounts' | 'categories'>>,
        public editingCategory: ReturnType<typeof signal<Category | null>>,
        public editingFixedCost: ReturnType<typeof signal<FixedCost | null>>,
        public editingTransaction: ReturnType<typeof signal<Transaction | null>>,
        public editingAccount: ReturnType<typeof signal<Account | null>>,
        public editingFixedCostGroup: ReturnType<typeof signal<FixedCostGroup | null>>,
        public prefillFromFixedCost: ReturnType<typeof signal<FixedCost | null>>,
        public currentTransactionType: ReturnType<typeof signal<'income' | 'expense' | 'transfer'>>,
        private toastService: ToastService
    ) { }

    // ==================== Toggle Methods ====================

    toggleSettingsModal() {
        this.showSettingsModal.update(v => !v);
        if (!this.showSettingsModal()) {
            this.settingsView.set('main');
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

    toggleFixedCostModal() {
        this.showFixedCostModal.set(!this.showFixedCostModal());
        if (!this.showFixedCostModal()) {
            this.editingFixedCost.set(null);
        }
    }

    toggleFixedCostGroupModal() {
        this.showFixedCostGroupModal.set(!this.showFixedCostGroupModal());
        if (!this.showFixedCostGroupModal()) {
            this.editingFixedCostGroup.set(null);
        }
    }

    // ==================== Open Modal Methods ====================

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

    openEditAccountModal(account: Account) {
        this.editingAccount.set(account);
        this.showAccountModal.set(true);
    }

    openEditCategoryModal(category: Category) {
        this.editingCategory.set(category);
        this.showCategoryModal.set(true);
    }

    openEditFixedCostModal(fixedCost: FixedCost) {
        this.editingFixedCost.set(fixedCost);
        this.showFixedCostModal.set(true);
    }

    openEditFixedCostGroupModal(group: FixedCostGroup) {
        this.editingFixedCostGroup.set(group);
        this.showFixedCostGroupModal.set(true);
    }

    // ==================== Submit Handlers ====================

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

        this.showTransactionModal.set(false);
        this.editingTransaction.set(null);
        this.prefillFromFixedCost.set(null);

        if (isFromFixedCost) {
            this.toastService.show(`Fixkosten "${data.description}" gebucht`, 'success');
        } else if (isEditing) {
            this.toastService.show('Transaktion aktualisiert', 'success');
        } else {
            this.toastService.show('Transaktion hinzugefügt', 'success');
        }
    }

    onAccountModalSubmit(data: { name: string; balance: number }) {
        if (this.editingAccount()) {
            this.stateService.updateAccount(this.editingAccount()!.id, data.name, data.balance);
        } else {
            this.stateService.addAccount(data.name, data.balance);
        }

        this.showAccountModal.set(false);
        this.editingAccount.set(null);
    }

    onCategoryModalSubmit(data: { name: string; type: 'income' | 'expense' | 'both' }) {
        if (!data || typeof data.name !== 'string' || !['income', 'expense', 'both'].includes(data.type)) {
            return;
        }

        if (this.editingCategory()) {
            this.stateService.updateCategory(this.editingCategory()!.id, data.name, data.type);
        } else {
            this.stateService.addCategory(data.name, data.type);
        }

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

    onFixedCostGroupModalSubmit(data: { name: string }) {
        const isEditing = !!this.editingFixedCostGroup();

        if (isEditing) {
            this.stateService.updateFixedCostGroup(this.editingFixedCostGroup()!.id, data.name);
            this.toastService.show(`Gruppe "${data.name}" aktualisiert`, 'success');
        } else {
            this.stateService.addFixedCostGroup(data.name);
            this.toastService.show(`Gruppe "${data.name}" erstellt - verschiebe jetzt Fixkosten in die Gruppe`, 'success');
        }

        this.showFixedCostGroupModal.set(false);
        this.editingFixedCostGroup.set(null);
    }
}
