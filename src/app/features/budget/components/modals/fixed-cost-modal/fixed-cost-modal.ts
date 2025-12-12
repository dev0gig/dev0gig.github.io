import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FixedCost, Account, Category, FixedCostGroup } from '../../../budget.models';
import { BudgetStateService } from '../../../budget.state.service';

@Component({
    selector: 'app-fixed-cost-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fixed-cost-modal.html'
})
export class FixedCostModalComponent implements OnInit {
    private stateService = inject(BudgetStateService);

    @Input() editingFixedCost: FixedCost | null = null;
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];
    @Input() groups: FixedCostGroup[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{
        name: string;
        amount: number;
        type: 'income' | 'expense' | 'transfer';
        category: string;
        account: string;
        toAccount?: string;
        groupId?: string;
        note?: string;
        excludeFromTotal?: boolean;
    }>();

    currentType = signal<'income' | 'expense' | 'transfer'>('expense');

    ngOnInit(): void {
        if (this.editingFixedCost) {
            this.currentType.set(this.editingFixedCost.type);
        }
    }

    setType(type: 'income' | 'expense' | 'transfer'): void {
        this.currentType.set(type);
    }

    /**
     * Gets categories filtered by current type:
     * - income: shows categories with type 'income' or 'both'
     * - expense: shows categories with type 'expense' or 'both'
     * - transfer: returns empty array (transfers have no category)
     */
    getFilteredCategories(): Category[] {
        const type = this.currentType();

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
        return this.currentType() === 'transfer';
    }

    getSortedGroups(): FixedCostGroup[] {
        return [...this.groups].sort((a, b) => a.order - b.order);
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        this.submit.emit({
            name: formData.get('fixedCostName') as string,
            amount: parseFloat(formData.get('fixedCostAmount') as string),
            type: this.currentType(),
            category: formData.get('fixedCostCategory') as string,
            account: formData.get('fixedCostAccount') as string,
            toAccount: this.currentType() === 'transfer' ? formData.get('fixedCostToAccount') as string : undefined,
            groupId: formData.get('fixedCostGroup') as string || undefined,
            note: formData.get('fixedCostNote') as string || undefined,
            excludeFromTotal: (formData.get('fixedCostExclude') as string) === 'on'
        });
    }

    onClose(): void {
        this.close.emit();
    }
}

