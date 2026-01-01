import { Component, Input, Output, EventEmitter, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../budget.models';

@Component({
    selector: 'app-category-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './category-modal.html'
})
export class CategoryModalComponent implements OnInit {
    @Input() editingCategory: Category | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{ name: string; type: 'income' | 'expense' | 'both' }>();

    // Form state
    categoryName = signal('');
    categoryType = signal<'income' | 'expense' | 'both'>('expense');

    ngOnInit(): void {
        // Initialize form with editing data if present
        if (this.editingCategory) {
            this.categoryName.set(this.editingCategory.name);
            this.categoryType.set(this.editingCategory.type);
        } else {
            this.categoryName.set('');
            this.categoryType.set('expense');
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        event.stopPropagation(); // CRITICAL: Prevent native form submit from bubbling to parent!

        const name = this.categoryName().trim();
        const type = this.categoryType();

        if (!name) {
            return; // Don't submit if name is empty
        }

        this.submit.emit({
            name: name,
            type: type
        });
    }

    onClose(): void {
        this.close.emit();
    }
}
