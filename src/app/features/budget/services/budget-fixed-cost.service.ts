import { Injectable, inject } from '@angular/core';
import { FixedCost, FixedCostGroup, Transaction } from '../budget.models';
import { BudgetDataService } from './budget-data.service';
import { BudgetUtilityService } from '../budget.utility.service';

/**
 * BudgetFixedCostService - Manages fixed cost and group CRUD operations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetFixedCostService {

    private dataService = inject(BudgetDataService);
    private utilityService = inject(BudgetUtilityService);

    // ==================== Fixed Cost Getters ====================

    getFixedCosts(): FixedCost[] {
        return this.dataService.fixedCosts();
    }

    getFixedCostsSortedByCategory(): FixedCost[] {
        return [...this.dataService.fixedCosts()].sort((a, b) => {
            const categoryA = this.dataService.getCategoryFullName(a.category).toLowerCase();
            const categoryB = this.dataService.getCategoryFullName(b.category).toLowerCase();
            return categoryA.localeCompare(categoryB, 'de');
        });
    }

    getFixedCostsTotal(): number {
        return this.dataService.fixedCosts()
            .filter(fc => fc.type === 'expense' && !fc.excludeFromTotal)
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getFixedIncomeTotal(): number {
        return this.dataService.fixedCosts()
            .filter(fc => fc.type === 'income' && !fc.excludeFromTotal)
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getFixedTransferTotal(): number {
        return this.dataService.fixedCosts()
            .filter(fc => fc.type === 'transfer' && !fc.excludeFromTotal)
            .reduce((sum, fc) => sum + fc.amount, 0);
    }

    getExcludedFixedCostsTotal(): number {
        return this.dataService.fixedCosts()
            .filter(fc => fc.excludeFromTotal)
            .reduce((sum, fc) => {
                if (fc.type === 'income') return sum + fc.amount;
                return sum - fc.amount;
            }, 0);
    }

    getFixedIncomeCount(): number {
        return this.dataService.fixedCosts().filter(fc => fc.type === 'income' && !fc.excludeFromTotal).length;
    }

    getFixedExpenseCount(): number {
        return this.dataService.fixedCosts().filter(fc => fc.type === 'expense' && !fc.excludeFromTotal).length;
    }

    getFixedTransferCount(): number {
        return this.dataService.fixedCosts().filter(fc => fc.type === 'transfer' && !fc.excludeFromTotal).length;
    }

    getExcludedFixedCostsCount(): number {
        return this.dataService.fixedCosts().filter(fc => fc.excludeFromTotal).length;
    }

    getFixedCostsSortedByOrder(): FixedCost[] {
        return [...this.dataService.fixedCosts()].sort((a, b) => a.order - b.order);
    }

    getFixedCostGroupsSortedByOrder(): FixedCostGroup[] {
        return [...this.dataService.fixedCostGroups()].sort((a, b) => a.order - b.order);
    }

    // ==================== Fixed Cost CRUD ====================

    addFixedCost(data: {
        name: string;
        amount: number;
        type: 'income' | 'expense' | 'transfer';
        category: string;
        account: string;
        toAccount?: string;
        groupId?: string;
        note?: string;
        excludeFromTotal?: boolean;
    }) {
        // Validate data to prevent empty/invalid entries
        if (!data.name || data.name.trim() === '') {
            console.warn('addFixedCost: Invalid data - missing name');
            return;
        }
        if (isNaN(data.amount) || data.amount === null || data.amount === undefined) {
            console.warn('addFixedCost: Invalid data - invalid amount');
            return;
        }
        if (!data.category || !data.account) {
            console.warn('addFixedCost: Invalid data - missing category or account');
            return;
        }

        const currentFixedCosts = this.dataService.fixedCosts();
        const maxOrder = currentFixedCosts.length > 0
            ? Math.max(...currentFixedCosts.map(fc => fc.order))
            : -1;

        const fixedCost: FixedCost = {
            id: this.utilityService.generateId(),
            name: data.name.trim(),
            amount: data.amount,
            type: data.type,
            category: data.category,
            account: data.account,
            toAccount: data.toAccount,
            groupId: data.groupId,
            order: maxOrder + 1,
            note: data.note,
            excludeFromTotal: data.excludeFromTotal
        };
        this.dataService.fixedCosts.update(fc => [...fc, fixedCost]);
        this.dataService.saveFixedCosts();
    }

    updateFixedCost(id: string, data: {
        name: string;
        amount: number;
        type: 'income' | 'expense' | 'transfer';
        category: string;
        account: string;
        toAccount?: string;
        groupId?: string;
        note?: string;
        excludeFromTotal?: boolean;
    }) {
        this.dataService.fixedCosts.update(fcs =>
            fcs.map(fc => fc.id === id ? {
                ...fc,
                name: data.name,
                amount: data.amount,
                type: data.type,
                category: data.category,
                account: data.account,
                toAccount: data.toAccount,
                groupId: data.groupId,
                note: data.note,
                excludeFromTotal: data.excludeFromTotal
            } : fc)
        );
        this.dataService.saveFixedCosts();
    }

    deleteFixedCost(id: string) {
        this.dataService.fixedCosts.update(fc => fc.filter(item => item.id !== id));
        this.dataService.saveFixedCosts();
    }

    copyTransactionToFixedCost(transaction: Transaction) {
        const currentFixedCosts = this.dataService.fixedCosts();
        const maxOrder = currentFixedCosts.length > 0
            ? Math.max(...currentFixedCosts.map(fc => fc.order))
            : -1;

        const fixedCost: FixedCost = {
            id: this.utilityService.generateId(),
            name: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            account: transaction.account,
            toAccount: transaction.toAccount,
            order: maxOrder + 1,
            note: transaction.note
        };

        this.dataService.fixedCosts.update(fc => [...fc, fixedCost]);
        this.dataService.saveFixedCosts();
    }

    reorderFixedCosts(fixedCostIds: string[]) {
        // Get the minimum order value of the items being reordered
        const currentFixedCosts = this.dataService.fixedCosts();
        const reorderedItems = fixedCostIds.map(id => currentFixedCosts.find(fc => fc.id === id)).filter(Boolean) as FixedCost[];
        const minOrder = reorderedItems.length > 0 ? Math.min(...reorderedItems.map(fc => fc.order)) : 0;

        this.dataService.fixedCosts.update(fcs => {
            return fcs.map(fc => {
                const newIndex = fixedCostIds.indexOf(fc.id);
                if (newIndex !== -1) {
                    return { ...fc, order: minOrder + newIndex };
                }
                return fc;
            });
        });
        this.dataService.saveFixedCosts();
    }

    // ==================== Fixed Cost Group Operations ====================

    addFixedCostGroup(name: string) {
        const currentGroups = this.dataService.fixedCostGroups();
        const maxOrder = currentGroups.length > 0
            ? Math.max(...currentGroups.map(g => g.order))
            : -1;

        const group: FixedCostGroup = {
            id: this.utilityService.generateId(),
            name,
            order: maxOrder + 1,
            collapsed: false
        };
        this.dataService.fixedCostGroups.update(g => [...g, group]);
        this.dataService.saveFixedCostGroups();
        return group;
    }

    updateFixedCostGroup(id: string, name: string) {
        this.dataService.fixedCostGroups.update(groups =>
            groups.map(g => g.id === id ? { ...g, name } : g)
        );
        this.dataService.saveFixedCostGroups();
    }

    deleteFixedCostGroup(id: string) {
        // Remove group and unassign fixed costs from this group
        this.dataService.fixedCostGroups.update(g => g.filter(group => group.id !== id));
        this.dataService.fixedCosts.update(fcs =>
            fcs.map(fc => fc.groupId === id ? { ...fc, groupId: undefined } : fc)
        );
        this.dataService.saveFixedCostGroups();
        this.dataService.saveFixedCosts();
    }

    toggleFixedCostGroupCollapsed(id: string) {
        this.dataService.fixedCostGroups.update(groups =>
            groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
        );
        this.dataService.saveFixedCostGroups();
    }

    reorderFixedCostGroups(groupIds: string[]) {
        this.dataService.fixedCostGroups.update(groups => {
            return groups.map(g => {
                const newOrder = groupIds.indexOf(g.id);
                return newOrder !== -1 ? { ...g, order: newOrder } : g;
            });
        });
        this.dataService.saveFixedCostGroups();
    }

    deleteAllFixedCostGroups() {
        // Unassign all fixed costs from groups
        this.dataService.fixedCosts.update(fcs =>
            fcs.map(fc => ({ ...fc, groupId: undefined }))
        );
        // Clear all groups
        this.dataService.fixedCostGroups.set([]);
        this.dataService.saveFixedCostGroups();
        this.dataService.saveFixedCosts();
    }

    deleteSelectedFixedCostGroups(ids: string[]) {
        // Unassign fixed costs from selected groups
        this.dataService.fixedCosts.update(fcs =>
            fcs.map(fc => ids.includes(fc.groupId || '') ? { ...fc, groupId: undefined } : fc)
        );
        // Remove selected groups
        this.dataService.fixedCostGroups.update(groups =>
            groups.filter(g => !ids.includes(g.id))
        );
        this.dataService.saveFixedCostGroups();
        this.dataService.saveFixedCosts();
    }
}
