import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Account, Category } from '../../budget.models';
import { BudgetStateService } from '../../budget.state.service';
import { BudgetUtilityService } from '../../budget.utility.service';

@Component({
    selector: 'app-transactions-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transactions-view.html'
})
export class TransactionsViewComponent {
    private stateService = inject(BudgetStateService);
    private utilityService = inject(BudgetUtilityService);

    @Input() transactions: Transaction[] = [];
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];
    @Input() searchQuery = '';

    @Output() addTransaction = new EventEmitter<void>();
    @Output() editTransaction = new EventEmitter<Transaction>();
    @Output() deleteTransaction = new EventEmitter<string>();
    @Output() copyToFixedCost = new EventEmitter<Transaction>();
    @Output() search = new EventEmitter<string>();

    // Local state for inline editing
    expandedTransactionId = signal<string | null>(null);
    editingTransactionId = signal<string | null>(null);
    inlineTransactionTypes = signal<Map<string, 'income' | 'expense' | 'transfer'>>(new Map());

    // Helper methods
    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    formatDate(dateStr: string): string {
        return this.utilityService.formatDate(dateStr);
    }

    getAccountById(id: string): Account | undefined {
        return this.accounts.find(a => a.id === id);
    }

    getCategoryById(id: string): Category | undefined {
        return this.categories.find(c => c.id === id);
    }

    getCategoryFullName(id: string): string {
        return this.stateService.getCategoryFullName(id);
    }

    /**
     * Gets categories filtered by transaction type for inline editing:
     * - income: shows categories with type 'income' or 'both'
     * - expense: shows categories with type 'expense' or 'both'
     * - transfer: returns empty array (transfers have no category)
     */
    getFilteredCategoriesForTransaction(transactionId: string): Category[] {
        const type = this.getInlineTransactionType(transactionId);

        // Transfers don't have categories
        if (type === 'transfer') {
            return [];
        }

        // Filter categories based on type
        return [...this.categories]
            .filter(cat => {
                if (cat.type === 'both') return true;
                return cat.type === type;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Check if category field should be disabled for a specific transaction (for transfers)
     */
    isCategoryDisabledForTransaction(transactionId: string): boolean {
        return this.getInlineTransactionType(transactionId) === 'transfer';
    }

    // Expansion and inline edit
    toggleExpansion(id: string): void {
        if (this.expandedTransactionId() === id) {
            this.expandedTransactionId.set(null);
            this.editingTransactionId.set(null);
        } else {
            this.expandedTransactionId.set(id);
            // Initialize type for inline editing
            const transaction = this.transactions.find(t => t.id === id);
            if (transaction) {
                const types = new Map(this.inlineTransactionTypes());
                types.set(id, transaction.type);
                this.inlineTransactionTypes.set(types);
            }
        }
    }

    toggleInlineEdit(id: string): void {
        this.editingTransactionId.set(this.editingTransactionId() === id ? null : id);
    }

    cancelInlineEdit(id: string): void {
        this.editingTransactionId.set(null);
        // Reset type to original
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            const types = new Map(this.inlineTransactionTypes());
            types.set(id, transaction.type);
            this.inlineTransactionTypes.set(types);
        }
    }

    isEditingInline(id: string): boolean {
        return this.editingTransactionId() === id;
    }

    getInlineTransactionType(id: string): 'income' | 'expense' | 'transfer' {
        return this.inlineTransactionTypes().get(id) || 'expense';
    }

    setInlineTransactionType(id: string, type: 'income' | 'expense' | 'transfer'): void {
        const types = new Map(this.inlineTransactionTypes());
        types.set(id, type);
        this.inlineTransactionTypes.set(types);
    }

    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.search.emit(value);
    }

    onInlineTransactionEdit(event: Event, transactionId: string): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const type = this.getInlineTransactionType(transactionId);
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const updatedTransaction: Transaction = {
            ...transaction,
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description') as string,
            category: formData.get('category') as string,
            account: formData.get('account') as string,
            date: formData.get('date') as string,
            type: type,
            toAccount: type === 'transfer' ? formData.get('toAccount') as string : undefined,
            note: formData.get('note') as string || undefined
        };

        this.stateService.updateTransaction(transactionId, updatedTransaction, transaction);
        this.editingTransactionId.set(null);
    }

    onDeleteTransaction(id: string): void {
        this.deleteTransaction.emit(id);
    }

    onCopyToFixedCost(transaction: Transaction): void {
        this.copyToFixedCost.emit(transaction);
    }
}
