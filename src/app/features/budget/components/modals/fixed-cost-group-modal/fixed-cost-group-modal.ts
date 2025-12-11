import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FixedCostGroup } from '../../../budget.models';

@Component({
    selector: 'app-fixed-cost-group-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fixed-cost-group-modal.html'
})
export class FixedCostGroupModalComponent implements OnChanges, OnInit {
    @Input() editingGroup: FixedCostGroup | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() groupSubmit = new EventEmitter<{ name: string }>();

    groupName = '';

    ngOnInit(): void {
        // Initialize groupName when component loads
        this.groupName = this.editingGroup?.name || '';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['editingGroup']) {
            this.groupName = this.editingGroup?.name || '';
        }
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const nameFromForm = formData.get('groupName') as string;

        // Use form data directly as it's more reliable than ngModel in some edge cases
        const name = nameFromForm || this.groupName;

        if (name && name.trim()) {
            this.groupSubmit.emit({ name: name.trim() });
            // Reset after submit
            this.groupName = '';
        }
    }

    onClose(): void {
        this.groupName = '';
        this.close.emit();
    }
}
