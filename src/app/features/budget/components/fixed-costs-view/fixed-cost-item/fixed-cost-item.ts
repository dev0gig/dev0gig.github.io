import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FixedCost, Account, Category, FixedCostGroup } from '../../../budget.models';
import { BudgetUtilityService } from '../../../budget.utility.service';

@Component({
    selector: 'app-fixed-cost-item',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule],
    templateUrl: './fixed-cost-item.html',
    styleUrls: ['./fixed-cost-item.css']
})
export class FixedCostItemComponent {
    @Input({ required: true }) fixedCost!: FixedCost;
    @Input({ required: true }) accounts: Account[] = [];
    @Input({ required: true }) categories: Category[] = [];
    @Input({ required: true }) groups: FixedCostGroup[] = [];

    @Input() isExpanded = false;
    @Input() isEditing = false;

    // Output events
    @Output() expand = new EventEmitter<string>();
    @Output() toggleEdit = new EventEmitter<string>();
    @Output() cancelEdit = new EventEmitter<string>();
    @Output() save = new EventEmitter<any>(); // Will emit updated FixedCost data
    @Output() delete = new EventEmitter<string>();
    @Output() book = new EventEmitter<FixedCost>();

    constructor(private utilityService: BudgetUtilityService) { }

    // Local state for the edit form type (income/expense/transfer) 
    // We initialize this when editing starts or when input changes
    editType = signal<'income' | 'expense' | 'transfer'>('expense');

    ngOnChanges() {
        if (this.fixedCost) {
            // Sync local edit type with input if not currently editing (or initial load)
            if (!this.isEditing) {
                this.editType.set(this.fixedCost.type);
            }
        }
    }

    // Helper methods from original view
    formatCurrency(amount: number) {
        return this.utilityService.formatCurrency(amount);
    }

    getAccountById(id: string) {
        return this.accounts.find(a => a.id === id);
    }

    getCategoryFullName(categoryId: string) {
        const cat = this.categories.find(c => c.id === categoryId);
        return cat ? cat.name : 'Unbekannt';
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

    // Edit form logic

    setType(type: 'income' | 'expense' | 'transfer') {
        if (this.isEditing) {
            this.editType.set(type);
        }
    }

    getFilteredCategories() {
        const type = this.editType();
        if (type === 'transfer') return [];
        return this.categories.filter(c => c.type === 'both' || c.type === type);
    }

    isCategoryDisabled() {
        return this.editType() === 'transfer';
    }

    onSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const data: any = {
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount') as string),
            type: this.editType(),
            account: formData.get('account'),
            note: formData.get('note'),
            excludeFromTotal: formData.get('excludeFromTotal') === 'on'
        };

        if (data.type === 'transfer') {
            data.toAccount = formData.get('toAccount');
            data.category = ''; // Clear category for transfers
        } else {
            data.category = formData.get('category');
            data.toAccount = undefined;
        }

        if (this.groups.length > 0) {
            const groupId = formData.get('groupId') as string;
            data.groupId = groupId || undefined; // Handle empty string as undefined
        }

        this.save.emit(data);
    }
}
