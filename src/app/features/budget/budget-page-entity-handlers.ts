import { signal } from '@angular/core';
import { Transaction, FixedCost } from './budget.models';
import { BudgetStateService } from './budget.state.service';

/**
 * Budget Page Entity Handlers - Manages entity-level operations (delete, inline edit, etc.)
 */
export class BudgetPageEntityHandlers {

    constructor(
        private stateService: BudgetStateService,
        public expandedTransactionId: ReturnType<typeof signal<string | null>>,
        public inlineEditingTransactionId: ReturnType<typeof signal<string | null>>,
        public inlineTransactionTypes: ReturnType<typeof signal<Map<string, 'income' | 'expense' | 'transfer'>>>,
        public currentTransactionType: ReturnType<typeof signal<'income' | 'expense' | 'transfer'>>,
        public prefillFromFixedCost: ReturnType<typeof signal<FixedCost | null>>,
        public showTransactionModal: ReturnType<typeof signal<boolean>>,
        private showToastFn: (message: string) => void
    ) { }

    // ==================== Account Methods ====================

    selectAccount(id: string | null) {
        this.stateService.selectAccount(id);
    }

    deleteAccount(id: string) {
        if (confirm('Möchten Sie dieses Konto wirklich löschen?')) {
            this.stateService.deleteAccount(id);
        }
    }

    // ==================== Category Methods ====================

    deleteCategory(id: string) {
        if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
            this.stateService.deleteCategory(id);
        }
    }

    deleteAllCategories() {
        console.log('[EntityHandlers] deleteAllCategories called');
        console.log('[EntityHandlers] Categories BEFORE delete:', JSON.stringify(this.stateService.categories()));
        this.stateService.deleteAllCategories();
        console.log('[EntityHandlers] Categories AFTER delete:', JSON.stringify(this.stateService.categories()));
        this.showToastFn('Alle Kategorien gelöscht');
    }

    deleteSelectedCategories(ids: string[]) {
        console.log('[EntityHandlers] deleteSelectedCategories called with ids:', ids);
        console.log('[EntityHandlers] Categories BEFORE delete:', JSON.stringify(this.stateService.categories()));
        this.stateService.deleteSelectedCategories(ids);
        console.log('[EntityHandlers] Categories AFTER delete:', JSON.stringify(this.stateService.categories()));
        this.showToastFn(`${ids.length} Kategorien gelöscht`);
    }

    loadDefaultCategories(): number {
        const addedCount = this.stateService.addDefaultCategories();
        if (addedCount > 0) {
            this.showToastFn(`${addedCount} Standardkategorien hinzugefügt`);
        } else {
            this.showToastFn('Alle Standardkategorien sind bereits vorhanden');
        }
        return addedCount;
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

    deleteFixedCost(id: string) {
        if (confirm('Möchten Sie diese Fixkosten wirklich löschen?')) {
            this.stateService.deleteFixedCost(id);
        }
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

    // ==================== Fixed Cost Group Methods ====================

    deleteFixedCostGroup(id: string) {
        if (confirm('Möchten Sie diese Gruppe wirklich löschen? Die Fixkosten bleiben erhalten.')) {
            this.stateService.deleteFixedCostGroup(id);
        }
    }

    reorderFixedCosts(ids: string[]) {
        this.stateService.reorderFixedCosts(ids);
    }

    deleteAllFixedCostGroups() {
        if (confirm('Möchten Sie wirklich ALLE Gruppen löschen? Die Fixkosten bleiben erhalten.')) {
            this.stateService.deleteAllFixedCostGroups();
            this.showToastFn('Alle Gruppen gelöscht');
        }
    }

    deleteSelectedFixedCostGroups(ids: string[]) {
        if (confirm(`Möchten Sie die ${ids.length} ausgewählten Gruppen wirklich löschen?`)) {
            this.stateService.deleteSelectedFixedCostGroups(ids);
            this.showToastFn(`${ids.length} Gruppen gelöscht`);
        }
    }

    reorderFixedCostGroups(ids: string[]) {
        this.stateService.reorderFixedCostGroups(ids);
    }
}
