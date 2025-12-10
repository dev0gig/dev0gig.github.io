import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../budget.models';

@Component({
    selector: 'app-category-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './category-modal.html'
})
export class CategoryModalComponent {
    @Input() editingCategory: Category | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{ name: string; type: 'income' | 'expense' | 'both' }>();

    onSubmit(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        this.submit.emit({
            name: formData.get('categoryName') as string,
            type: formData.get('categoryType') as 'income' | 'expense' | 'both'
        });
    }

    onClose(): void {
        this.close.emit();
    }
}
