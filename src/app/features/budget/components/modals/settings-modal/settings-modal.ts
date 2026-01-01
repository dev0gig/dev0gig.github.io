import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Account, Category, FixedCostGroup } from '../../../budget.models';
import { BudgetUtilityService } from '../../../budget.utility.service';

@Component({
    selector: 'app-settings-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule],
    templateUrl: './settings-modal.html'
})
export class SettingsModalComponent {
    private utilityService = inject(BudgetUtilityService);

    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];
    @Input() groups: FixedCostGroup[] = [];

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
    @Output() deleteAllCategories = new EventEmitter<void>();
    @Output() deleteSelectedCategories = new EventEmitter<string[]>();
    @Output() loadDefaultCategories = new EventEmitter<void>();

    // Group events
    @Output() addGroup = new EventEmitter<void>();
    @Output() editGroup = new EventEmitter<FixedCostGroup>();
    @Output() deleteGroup = new EventEmitter<string>();
    @Output() deleteAllGroups = new EventEmitter<void>();
    @Output() deleteSelectedGroups = new EventEmitter<string[]>();
    @Output() reorderGroups = new EventEmitter<string[]>();

    settingsView = signal<'main' | 'accounts' | 'categories' | 'groups'>('main');

    // Group selection state
    selectedGroupIds = signal<Set<string>>(new Set());

    // Category selection state
    selectedCategoryIds = signal<Set<string>>(new Set());

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    getSortedCategories(): Category[] {
        // Filter out any corrupted categories (missing name) before sorting
        return [...this.categories]
            .filter(c => c.name && typeof c.name === 'string')
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    getSortedGroups(): FixedCostGroup[] {
        return [...this.groups].sort((a, b) => a.order - b.order);
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

    onDeleteAllCategories(): void {
        this.deleteAllCategories.emit();
        this.selectedCategoryIds.set(new Set());
    }

    onLoadDefaultCategories(): void {
        this.loadDefaultCategories.emit();
    }

    onDeleteSelectedCategories(): void {
        const ids = Array.from(this.selectedCategoryIds());
        if (ids.length > 0) {
            this.deleteSelectedCategories.emit(ids);
            this.selectedCategoryIds.set(new Set());
        }
    }

    toggleCategorySelection(id: string): void {
        this.selectedCategoryIds.update(set => {
            const newSet = new Set(set);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    isCategorySelected(id: string): boolean {
        return this.selectedCategoryIds().has(id);
    }

    hasSelectedCategories(): boolean {
        return this.selectedCategoryIds().size > 0;
    }

    // Group methods
    onAddGroup(): void {
        this.addGroup.emit();
    }

    onEditGroup(group: FixedCostGroup): void {
        this.editGroup.emit(group);
    }

    onDeleteGroup(id: string): void {
        this.deleteGroup.emit(id);
    }

    onDeleteAllGroups(): void {
        this.deleteAllGroups.emit();
        this.selectedGroupIds.set(new Set());
    }

    onDeleteSelectedGroups(): void {
        const ids = Array.from(this.selectedGroupIds());
        if (ids.length > 0) {
            this.deleteSelectedGroups.emit(ids);
            this.selectedGroupIds.set(new Set());
        }
    }

    toggleGroupSelection(id: string): void {
        this.selectedGroupIds.update(set => {
            const newSet = new Set(set);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    isGroupSelected(id: string): boolean {
        return this.selectedGroupIds().has(id);
    }

    hasSelectedGroups(): boolean {
        return this.selectedGroupIds().size > 0;
    }

    onGroupDrop(event: CdkDragDrop<FixedCostGroup[]>): void {
        const sortedGroups = this.getSortedGroups();
        moveItemInArray(sortedGroups, event.previousIndex, event.currentIndex);
        const newOrder = sortedGroups.map(g => g.id);
        this.reorderGroups.emit(newOrder);
    }
}
