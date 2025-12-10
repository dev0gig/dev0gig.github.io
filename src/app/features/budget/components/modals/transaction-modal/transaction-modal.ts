import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
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
export class TransactionModalComponent {
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
    }>();

    currentTransactionType = signal<'income' | 'expense' | 'transfer'>('expense');

    ngOnInit(): void {
        if (this.editingTransaction) {
            this.currentTransactionType.set(this.editingTransaction.type);
        } else if (this.prefillFromFixedCost) {
            this.currentTransactionType.set(this.prefillFromFixedCost.type === 'income' ? 'income' : 'expense');
        }
    }

    setTransactionType(type: 'income' | 'expense' | 'transfer'): void {
        this.currentTransactionType.set(type);
    }

    getTodayDateString(): string {
        return this.utilityService.getTodayDateString();
    }

    getSortedCategories(): Category[] {
        return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
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
            toAccount: this.currentTransactionType() === 'transfer' ? formData.get('toAccount') as string : undefined
        });
    }

    onClose(): void {
        this.close.emit();
    }
}
