import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FixedCost, Account, Category } from '../../budget.models';
import { BudgetUtilityService } from '../../budget.utility.service';
import { BudgetStateService } from '../../budget.state.service';

@Component({
    selector: 'app-fixed-costs-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './fixed-costs-view.html'
})
export class FixedCostsViewComponent {
    private utilityService = inject(BudgetUtilityService);
    private stateService = inject(BudgetStateService);

    @Input() fixedCosts: FixedCost[] = [];
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];
    @Input() fixedIncomeTotal = 0;
    @Input() fixedCostsTotal = 0;
    @Input() fixedIncomeCount = 0;
    @Input() fixedExpenseCount = 0;

    @Output() addFixedCost = new EventEmitter<void>();
    @Output() editFixedCost = new EventEmitter<FixedCost>();
    @Output() deleteFixedCost = new EventEmitter<string>();
    @Output() createTransaction = new EventEmitter<FixedCost>();

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    getAccountById(id: string): Account | undefined {
        return this.accounts.find(a => a.id === id);
    }

    getCategoryFullName(id: string): string {
        return this.stateService.getCategoryFullName(id);
    }

    onAddFixedCost(): void {
        this.addFixedCost.emit();
    }

    onEditFixedCost(fixedCost: FixedCost): void {
        this.editFixedCost.emit(fixedCost);
    }

    onDeleteFixedCost(id: string): void {
        this.deleteFixedCost.emit(id);
    }

    onCreateTransaction(fixedCost: FixedCost): void {
        this.createTransaction.emit(fixedCost);
    }
}
