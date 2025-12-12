import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Account, Category, FixedCost } from '../../../budget.models';
import { BudgetUtilityService } from '../../../budget.utility.service';

@Component({
    selector: 'app-transaction-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transaction-modal.html'
})
export class TransactionModalComponent implements OnInit, OnDestroy {
    private utilityService = inject(BudgetUtilityService);

    @Input() editingTransaction: Transaction | null = null;
    @Input() prefillFromFixedCost: FixedCost | null = null;
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{
        type: 'income' | 'expense' | 'transfer';
        amount: number;
        description: string;
        category: string;
        account: string;
        date: string;
        toAccount?: string;
        note?: string;
    }>();

    currentTransactionType = signal<'income' | 'expense' | 'transfer'>('expense');

    ngOnInit(): void {
        document.body.classList.add('overflow-hidden');
        if (this.editingTransaction) {
            this.currentTransactionType.set(this.editingTransaction.type);
        } else if (this.prefillFromFixedCost) {
            this.currentTransactionType.set(this.prefillFromFixedCost.type === 'income' ? 'income' : 'expense');
        }
    }

    ngOnDestroy(): void {
        document.body.classList.remove('overflow-hidden');
    }

    setTransactionType(type: 'income' | 'expense' | 'transfer'): void {
        this.currentTransactionType.set(type);
    }

    getTodayDateString(): string {
        return this.utilityService.getTodayDateString();
    }

    /**
     * Gets categories filtered by current transaction type:
     * - income: shows categories with type 'income' or 'both'
     * - expense: shows categories with type 'expense' or 'both'
     * - transfer: returns empty array (transfers have no category)
     */
    getFilteredCategories(): Category[] {
        const type = this.currentTransactionType();

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
     * Check if category field should be disabled (for transfers)
     */
    isCategoryDisabled(): boolean {
        return this.currentTransactionType() === 'transfer';
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        this.submit.emit({
            type: this.currentTransactionType(),
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description') as string,
            category: formData.get('category') as string,
            account: formData.get('account') as string,
            date: formData.get('date') as string,
            toAccount: this.currentTransactionType() === 'transfer' ? formData.get('toAccount') as string : undefined,
            note: formData.get('note') as string || undefined
        });
    }

    onClose(): void {
        this.close.emit();
    }
}
