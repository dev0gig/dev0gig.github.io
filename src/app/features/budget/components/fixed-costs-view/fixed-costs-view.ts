import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FixedCost, Account, Category, FixedCostGroup } from '../../budget.models';
import { BudgetUtilityService } from '../../budget.utility.service';
import { BudgetStateService } from '../../budget.state.service';
import { BudgetPdfService } from '../../budget.pdf.service';
import { FixedCostItemComponent } from './fixed-cost-item/fixed-cost-item';

@Component({
    selector: 'app-fixed-costs-view',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule, FixedCostItemComponent],
    templateUrl: './fixed-costs-view.html'
})
export class FixedCostsViewComponent {
    private utilityService = inject(BudgetUtilityService);
    private stateService = inject(BudgetStateService);
    private pdfService = inject(BudgetPdfService);

    @Input() fixedCosts: FixedCost[] = [];
    @Input() accounts: Account[] = [];
    @Input() categories: Category[] = [];
    @Input() groups: FixedCostGroup[] = [];
    @Input() fixedIncomeTotal = 0;
    @Input() fixedCostsTotal = 0;
    @Input() fixedTransferTotal = 0;
    @Input() fixedIncomeCount = 0;
    @Input() fixedExpenseCount = 0;
    @Input() fixedTransferCount = 0;
    @Input() excludedTotal = 0;
    @Input() excludedCount = 0;

    @Output() addFixedCost = new EventEmitter<void>();
    @Output() editFixedCost = new EventEmitter<FixedCost>();
    @Output() deleteFixedCost = new EventEmitter<string>();
    @Output() createTransaction = new EventEmitter<FixedCost>();
    @Output() addGroup = new EventEmitter<void>();
    @Output() editGroup = new EventEmitter<FixedCostGroup>();
    @Output() deleteGroup = new EventEmitter<string>();
    @Output() reorderFixedCosts = new EventEmitter<string[]>();

    // Updated output signature to match strict types
    @Output() submitFixedCost = new EventEmitter<{
        id?: string;
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

    // Inline editing state
    expandedFixedCostId = signal<string | null>(null);
    editingFixedCostId = signal<string | null>(null);

    // Expose Math to template
    Math = Math;

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    getGroupById(id: string): FixedCostGroup | undefined {
        return this.groups.find(g => g.id === id);
    }

    getSortedGroups(): FixedCostGroup[] {
        return [...this.groups].sort((a, b) => a.order - b.order);
    }

    getFixedCostsByGroup(groupId: string | null): FixedCost[] {
        return this.fixedCosts
            .filter(fc => {
                if (groupId === null) {
                    return !fc.groupId && !fc.excludeFromTotal;
                }
                return fc.groupId === groupId && !fc.excludeFromTotal;
            })
            .sort((a, b) => a.order - b.order);
    }

    getExcludedFixedCosts(): FixedCost[] {
        return this.fixedCosts
            .filter(fc => fc.excludeFromTotal)
            .sort((a, b) => a.order - b.order);
    }

    isGroupCollapsed(groupId: string): boolean {
        const group = this.getGroupById(groupId);
        return group?.collapsed ?? false;
    }

    toggleGroupCollapsed(groupId: string): void {
        this.stateService.toggleFixedCostGroupCollapsed(groupId);
    }

    // Expansion and inline editing
    toggleExpansion(id: string): void {
        if (this.expandedFixedCostId() === id) {
            this.expandedFixedCostId.set(null);
            this.editingFixedCostId.set(null);
        } else {
            this.expandedFixedCostId.set(id);
        }
    }

    toggleInlineEdit(id: string): void {
        this.editingFixedCostId.set(this.editingFixedCostId() === id ? null : id);
    }

    cancelInlineEdit(id: string): void {
        this.editingFixedCostId.set(null);
    }

    isEditingInline(id: string): boolean {
        return this.editingFixedCostId() === id;
    }

    // Handler for the save event from child component
    onSaveFixedCost(id: string, data: any): void {
        const fixedCost = this.fixedCosts.find(fc => fc.id === id);
        if (!fixedCost) return;

        this.stateService.updateFixedCost(id, data);
        this.editingFixedCostId.set(null);
    }

    onDrop(event: CdkDragDrop<FixedCost[], FixedCost[], FixedCost>): void {
        const draggedItem = event.item.data as FixedCost;
        const targetContainer = event.container;
        const previousContainer = event.previousContainer;

        // Check if we're moving between different lists (different groups)
        if (previousContainer !== targetContainer) {
            // Determine the target group ID from the container's data
            const targetListData = targetContainer.data;
            let targetGroupId: string | undefined = undefined;

            // If target list has items, use the groupId from the first item
            // If list is empty, we need to determine groupId from container element
            if (targetListData.length > 0) {
                targetGroupId = targetListData[0].groupId;
            } else {
                // Empty list - check if it's the ungrouped list or a specific group
                // We'll use data attribute from the element
                const containerElement = targetContainer.element.nativeElement;
                const groupIdAttr = containerElement.getAttribute('data-group-id');
                if (groupIdAttr === 'null' || groupIdAttr === null) {
                    targetGroupId = undefined;
                } else if (groupIdAttr === 'excluded') {
                    // Moving to excluded list
                    // Special case: we need to set excludeFromTotal=true
                    // But here we rely on the implementation below
                    targetGroupId = undefined; // No group
                } else {
                    targetGroupId = groupIdAttr;
                }
            }

            // Check if moving to/from excluded list
            const isTargetExcluded = targetContainer.element.nativeElement.getAttribute('data-group-id') === 'excluded';

            // Update the fixed cost's groupId
            const currentData = this.fixedCosts.find(fc => fc.id === draggedItem.id);
            if (currentData) {
                this.stateService.updateFixedCost(draggedItem.id, {
                    name: currentData.name,
                    amount: currentData.amount,
                    type: currentData.type,
                    category: currentData.category,
                    account: currentData.account,
                    toAccount: currentData.toAccount,
                    groupId: isTargetExcluded ? undefined : targetGroupId,
                    note: currentData.note,
                    excludeFromTotal: isTargetExcluded ? true : false // If target is excluded list, set flag
                });
            }
        } else if (event.previousIndex !== event.currentIndex) {
            // Same list, just reordering
            const listData = event.container.data;
            if (!listData || listData.length === 0) return;

            // Create a mutable copy of the list
            const items = [...listData];
            moveItemInArray(items, event.previousIndex, event.currentIndex);

            // Emit the new order as array of IDs
            const newOrder = items.map(fc => fc.id);
            this.reorderFixedCosts.emit(newOrder);
        }
    }

    onAddFixedCost(): void {
        this.addFixedCost.emit();
    }

    onDeleteFixedCost(id: string): void {
        this.deleteFixedCost.emit(id);
    }

    onCreateTransaction(fixedCost: FixedCost): void {
        this.createTransaction.emit(fixedCost);
    }

    onAddGroup(): void {
        this.addGroup.emit();
    }

    onEditGroup(group: FixedCostGroup): void {
        this.editGroup.emit(group);
    }

    onDeleteGroup(id: string): void {
        this.deleteGroup.emit(id);
    }

    exportPdf(): void {
        this.pdfService.exportFixedCostsPdf();
    }
}
