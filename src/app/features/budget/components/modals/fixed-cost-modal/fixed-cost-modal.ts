import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FixedCost, Account, Category } from '../../../budget.models';
import { BudgetStateService } from '../../../budget.state.service';

@Component({
    selector: 'app-fixed-cost-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fixed-cost-modal.html'
})
export class FixedCostModalComponent {
    private stateService = inject(BudgetStateService);

    @Input() editingFixedCost: FixedCost | null = null;
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{
        name: string;
        amount: number;
        type: 'income' | 'expense';
        category: string;
        account: string;
    }>();

    getSortedCategories(): Category[] {
        return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        this.submit.emit({
            name: formData.get('fixedCostName') as string,
            amount: parseFloat(formData.get('fixedCostAmount') as string),
            type: formData.get('fixedCostType') as 'income' | 'expense',
            category: formData.get('fixedCostCategory') as string,
            account: formData.get('fixedCostAccount') as string
        });
    }

    onClose(): void {
        this.close.emit();
    }
}
