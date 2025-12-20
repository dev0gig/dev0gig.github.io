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
    @Output() transactionSubmit = new EventEmitter<{
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

    // Validation error signals
    hasAmountError = signal(false);
    hasDescriptionError = signal(false);
    hasCategoryError = signal(false);
    hasAccountError = signal(false);
    hasToAccountError = signal(false);
    hasDateError = signal(false);

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

        // Clear previous errors
        this.clearValidationErrors();

        // Validate required fields
        const amount = formData.get('amount') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const account = formData.get('account') as string;
        const toAccount = formData.get('toAccount') as string;
        const date = formData.get('date') as string;


        let hasErrors = false;

        // Validate amount - must be a valid positive number
        const parsedAmount = parseFloat(amount);
        if (!amount || amount.trim() === '' || isNaN(parsedAmount) || parsedAmount <= 0) {
            this.hasAmountError.set(true);
            hasErrors = true;
        }

        // Validate description - must not be empty
        if (!description || description.trim() === '') {
            this.hasDescriptionError.set(true);
            hasErrors = true;
        }

        // Validate category (only for non-transfer types)
        if (this.currentTransactionType() !== 'transfer' && (!category || category === '')) {
            this.hasCategoryError.set(true);
            hasErrors = true;
        }

        // Validate account - must be selected
        if (!account || account === '') {
            this.hasAccountError.set(true);
            hasErrors = true;
        }

        // Validate toAccount (only for transfer type)
        if (this.currentTransactionType() === 'transfer' && (!toAccount || toAccount === '')) {
            this.hasToAccountError.set(true);
            hasErrors = true;
        }

        // Validate date - must be present
        if (!date || date === '') {
            this.hasDateError.set(true);
            hasErrors = true;
        }

        // If there are errors, don't submit
        if (hasErrors) {
            // Clear errors after animation completes
            setTimeout(() => {
                this.clearValidationErrors();
            }, 2000);
            return;
        }

        this.transactionSubmit.emit({
            type: this.currentTransactionType(),
            amount: parsedAmount,
            description: description.trim(),
            category: category,
            account: account,
            date: date,
            toAccount: this.currentTransactionType() === 'transfer' ? toAccount : undefined,
            note: formData.get('note') as string || undefined
        });
    }

    private clearValidationErrors(): void {
        this.hasAmountError.set(false);
        this.hasDescriptionError.set(false);
        this.hasCategoryError.set(false);
        this.hasAccountError.set(false);
        this.hasToAccountError.set(false);
        this.hasDateError.set(false);
    }

    onClose(): void {
        this.close.emit();
    }
}
