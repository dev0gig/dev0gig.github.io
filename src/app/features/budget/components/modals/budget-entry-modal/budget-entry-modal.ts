import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, FixedCost, Account, Category, FixedCostGroup } from '../../../budget.models';
import { BudgetUtilityService } from '../../../budget.utility.service';
import { BudgetStateService } from '../../../budget.state.service';

export type BudgetEntryMode = 'transaction' | 'fixedCost' | 'bookFixedCost';

export interface BudgetEntrySubmitData {
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    name: string;
    category: string;
    account: string;
    toAccount?: string;
    date?: string;
    groupId?: string;
    note?: string;
    excludeFromTotal?: boolean;
}

@Component({
    selector: 'app-budget-entry-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './budget-entry-modal.html'
})
export class BudgetEntryModalComponent implements OnInit {
    private utilityService = inject(BudgetUtilityService);
    private stateService = inject(BudgetStateService);

    // Mode determines which fields are active/disabled
    @Input() mode: BudgetEntryMode = 'transaction';

    // Data for editing or prefilling
    @Input() editingTransaction: Transaction | null = null;
    @Input() editingFixedCost: FixedCost | null = null;
    @Input() prefillFromFixedCost: FixedCost | null = null;

    // Reference data
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];
    @Input() groups: FixedCostGroup[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() submitEntry = new EventEmitter<BudgetEntrySubmitData>();

    // State
    currentType = signal<'income' | 'expense' | 'transfer'>('expense');
    validationErrors = signal<Set<string>>(new Set());
    submitted = signal(false);

    ngOnInit(): void {
        // Initialize type based on editing/prefill data
        if (this.editingTransaction) {
            this.currentType.set(this.editingTransaction.type);
        } else if (this.editingFixedCost) {
            this.currentType.set(this.editingFixedCost.type);
        } else if (this.prefillFromFixedCost) {
            this.currentType.set(this.prefillFromFixedCost.type);
        }
    }

    // Dynamic title based on mode and editing state
    getTitle(): string {
        if (this.mode === 'fixedCost') {
            return this.editingFixedCost ? 'Fixkosten bearbeiten' : 'Neue Fixkosten';
        } else if (this.mode === 'bookFixedCost') {
            return 'Fixkosten buchen';
        } else {
            return this.editingTransaction ? 'Transaktion bearbeiten' : 'Neue Transaktion';
        }
    }

    // Get prefilled/editing values
    getNameValue(): string {
        if (this.editingTransaction) return this.editingTransaction.description;
        if (this.editingFixedCost) return this.editingFixedCost.name;
        if (this.prefillFromFixedCost) return this.prefillFromFixedCost.name;
        return '';
    }

    getAmountValue(): number | null {
        if (this.editingTransaction) return this.editingTransaction.amount;
        if (this.editingFixedCost) return this.editingFixedCost.amount;
        if (this.prefillFromFixedCost) return this.prefillFromFixedCost.amount;
        return null;
    }

    getCategoryValue(): string {
        if (this.editingTransaction) return this.editingTransaction.category;
        if (this.editingFixedCost) return this.editingFixedCost.category;
        if (this.prefillFromFixedCost) return this.prefillFromFixedCost.category;
        return '';
    }

    getAccountValue(): string {
        if (this.editingTransaction) return this.editingTransaction.account;
        if (this.editingFixedCost) return this.editingFixedCost.account;
        if (this.prefillFromFixedCost) return this.prefillFromFixedCost.account;
        return '';
    }

    getToAccountValue(): string {
        if (this.editingTransaction) return this.editingTransaction.toAccount || '';
        if (this.editingFixedCost) return this.editingFixedCost.toAccount || '';
        if (this.prefillFromFixedCost) return this.prefillFromFixedCost.toAccount || '';
        return '';
    }

    getDateValue(): string {
        if (this.editingTransaction) return this.editingTransaction.date;
        return this.utilityService.getTodayDateString();
    }

    getGroupValue(): string {
        if (this.editingFixedCost) return this.editingFixedCost.groupId || '';
        return '';
    }

    getNoteValue(): string {
        if (this.editingTransaction) return this.editingTransaction.note || '';
        if (this.editingFixedCost) return this.editingFixedCost.note || '';
        if (this.prefillFromFixedCost) return this.prefillFromFixedCost.note || '';
        return '';
    }

    getExcludeValue(): boolean {
        if (this.editingFixedCost) return this.editingFixedCost.excludeFromTotal || false;
        return false;
    }

    // Field disabled states based on mode
    isFieldDisabled(field: string): boolean {
        switch (field) {
            case 'type':
                return this.mode === 'bookFixedCost';
            case 'date':
                return this.mode === 'fixedCost';
            case 'group':
            case 'exclude':
                return this.mode !== 'fixedCost';
            default:
                return false;
        }
    }

    // Validation check
    hasError(field: string): boolean {
        return this.submitted() && this.validationErrors().has(field);
    }

    setType(type: 'income' | 'expense' | 'transfer'): void {
        if (!this.isFieldDisabled('type')) {
            this.currentType.set(type);
        }
    }

    getSortedCategories(): Category[] {
        return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
    }

    getSortedGroups(): FixedCostGroup[] {
        return this.stateService.getFixedCostGroupsSortedByOrder();
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        this.submitted.set(true);

        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Validate required fields
        const errors = new Set<string>();

        const name = formData.get('name') as string;
        const amountStr = formData.get('amount') as string;
        const category = formData.get('category') as string;
        const account = formData.get('account') as string;
        const toAccount = formData.get('toAccount') as string;
        const date = formData.get('date') as string;

        if (!name?.trim()) errors.add('name');
        if (!amountStr || isNaN(parseFloat(amountStr))) errors.add('amount');
        if (!category) errors.add('category');
        if (!account) errors.add('account');
        if (this.currentType() === 'transfer' && !toAccount) errors.add('toAccount');
        if (this.mode !== 'fixedCost' && !date) errors.add('date');

        this.validationErrors.set(errors);

        if (errors.size > 0) {
            return;
        }

        const data: BudgetEntrySubmitData = {
            type: this.currentType(),
            amount: parseFloat(amountStr),
            name: name.trim(),
            category,
            account,
            toAccount: this.currentType() === 'transfer' ? toAccount : undefined,
            date: this.mode !== 'fixedCost' ? date : undefined,
            groupId: this.mode === 'fixedCost' ? (formData.get('group') as string || undefined) : undefined,
            note: (formData.get('note') as string) || undefined,
            excludeFromTotal: this.mode === 'fixedCost' ? (formData.get('exclude') as string) === 'on' : undefined
        };

        this.submitEntry.emit(data);
    }

    onClose(): void {
        this.close.emit();
    }
}
