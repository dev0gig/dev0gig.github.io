import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account, Category } from '../../../budget.models';
import { BudgetUtilityService } from '../../../budget.utility.service';

@Component({
    selector: 'app-settings-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings-modal.html'
})
export class SettingsModalComponent {
    private utilityService = inject(BudgetUtilityService);

    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() importData = new EventEmitter<void>();
    @Output() exportData = new EventEmitter<void>();
    @Output() deleteAllTransactions = new EventEmitter<void>();
    @Output() addAccount = new EventEmitter<void>();
    @Output() editAccount = new EventEmitter<Account>();
    @Output() deleteAccount = new EventEmitter<string>();
    @Output() addCategory = new EventEmitter<void>();
    @Output() editCategory = new EventEmitter<Category>();
    @Output() deleteCategory = new EventEmitter<string>();

    settingsView = signal<'main' | 'accounts' | 'categories'>('main');

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    getSortedCategories(): Category[] {
        return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
    }

    onClose(): void {
        this.close.emit();
    }

    onImportData(): void {
        this.importData.emit();
    }

    onExportData(): void {
        this.exportData.emit();
    }

    onDeleteAllTransactions(): void {
        this.deleteAllTransactions.emit();
    }

    onAddAccount(): void {
        this.addAccount.emit();
    }

    onEditAccount(account: Account): void {
        this.editAccount.emit(account);
    }

    onDeleteAccount(id: string): void {
        this.deleteAccount.emit(id);
    }

    onAddCategory(): void {
        this.addCategory.emit();
    }

    onEditCategory(category: Category): void {
        this.editCategory.emit(category);
    }

    onDeleteCategory(id: string): void {
        this.deleteCategory.emit(id);
    }
}
