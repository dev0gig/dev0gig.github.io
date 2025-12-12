import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FixedCost, Account, Category, FixedCostGroup } from '../../budget.models';
import { BudgetUtilityService } from '../../budget.utility.service';
import { BudgetStateService } from '../../budget.state.service';
import { BudgetPdfService } from '../../budget.pdf.service';

@Component({
    selector: 'app-fixed-costs-view',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule],
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
    inlineFixedCostTypes = signal<Map<string, 'income' | 'expense' | 'transfer'>>(new Map());

    // Expose Math to template
    Math = Math;

    formatCurrency(amount: number): string {
        return this.utilityService.formatCurrency(amount);
    }

    getAccountById(id: string | undefined): Account | undefined {
        if (!id) return undefined;
        return this.accounts.find(a => a.id === id);
    }

    getCategoryFullName(id: string): string {
        return this.stateService.getCategoryFullName(id);
    }

    getGroupById(id: string): FixedCostGroup | undefined {
        return this.groups.find(g => g.id === id);
    }

    getSortedGroups(): FixedCostGroup[] {
        return [...this.groups].sort((a, b) => a.order - b.order);
    }

    getSortedCategories(): Category[] {
        return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Gets categories filtered by fixed cost type for inline editing:
     * - income: shows categories with type 'income' or 'both'
     * - expense: shows categories with type 'expense' or 'both'
     * - transfer: returns empty array (transfers have no category)
     */
    getFilteredCategoriesForFixedCost(fixedCostId: string): Category[] {
        const type = this.getInlineFixedCostType(fixedCostId);

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
     * Checks if category field should be disabled (for transfers)
     */
    isCategoryDisabledForFixedCost(fixedCostId: string): boolean {
        return this.getInlineFixedCostType(fixedCostId) === 'transfer';
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
            // Initialize type for inline editing
            const fixedCost = this.fixedCosts.find(fc => fc.id === id);
            if (fixedCost) {
                const types = new Map(this.inlineFixedCostTypes());
                types.set(id, fixedCost.type);
                this.inlineFixedCostTypes.set(types);
            }
        }
    }

    toggleInlineEdit(id: string): void {
        this.editingFixedCostId.set(this.editingFixedCostId() === id ? null : id);
    }

    cancelInlineEdit(id: string): void {
        this.editingFixedCostId.set(null);
        // Reset type to original
        const fixedCost = this.fixedCosts.find(fc => fc.id === id);
        if (fixedCost) {
            const types = new Map(this.inlineFixedCostTypes());
            types.set(id, fixedCost.type);
            this.inlineFixedCostTypes.set(types);
        }
    }

    isEditingInline(id: string): boolean {
        return this.editingFixedCostId() === id;
    }

    getInlineFixedCostType(id: string): 'income' | 'expense' | 'transfer' {
        return this.inlineFixedCostTypes().get(id) || 'expense';
    }

    setInlineFixedCostType(id: string, type: 'income' | 'expense' | 'transfer'): void {
        const types = new Map(this.inlineFixedCostTypes());
        types.set(id, type);
        this.inlineFixedCostTypes.set(types);
    }

    onInlineFixedCostEdit(event: Event, fixedCostId: string): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const type = this.getInlineFixedCostType(fixedCostId);
        const fixedCost = this.fixedCosts.find(fc => fc.id === fixedCostId);
        if (!fixedCost) return;

        const data = {
            name: formData.get('name') as string,
            amount: parseFloat(formData.get('amount') as string),
            type: type,
            category: formData.get('category') as string,
            account: formData.get('account') as string,
            toAccount: type === 'transfer' ? formData.get('toAccount') as string : undefined,
            groupId: formData.get('groupId') as string || undefined,
            note: formData.get('note') as string || undefined,
            excludeFromTotal: (formData.get('excludeFromTotal') as string) === 'on'
        };

        this.stateService.updateFixedCost(fixedCostId, data);
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
                } else {
                    targetGroupId = groupIdAttr;
                }
            }

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
                    groupId: targetGroupId,
                    note: currentData.note,
                    excludeFromTotal: currentData.excludeFromTotal
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

    getTypeIcon(type: 'income' | 'expense' | 'transfer'): string {
        switch (type) {
            case 'income': return 'trending_up';
            case 'expense': return 'trending_down';
            case 'transfer': return 'swap_horiz';
        }
    }

    getTypeColor(type: 'income' | 'expense' | 'transfer'): string {
        switch (type) {
            case 'income': return 'text-green-500';
            case 'expense': return 'text-red-500';
            case 'transfer': return 'text-purple-500';
        }
    }

    getTypeBgColor(type: 'income' | 'expense' | 'transfer'): string {
        switch (type) {
            case 'income': return 'bg-green-500/20';
            case 'expense': return 'bg-red-500/20';
            case 'transfer': return 'bg-purple-500/20';
        }
    }

    exportPdf(): void {
        this.pdfService.exportFixedCostsPdf();
    }
}
