import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../../../budget.models';

@Component({
    selector: 'app-account-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './account-modal.html'
})
export class AccountModalComponent {
    @Input() editingAccount: Account | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{ name: string; balance: number }>();

    onSubmit(event: Event): void {
        event.preventDefault();
        console.log('[AccountModal] onSubmit called');

        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const balanceRaw = formData.get('accountBalance') as string;
        const balance = balanceRaw ? parseFloat(balanceRaw) : 0;

        const data = {
            name: formData.get('accountName') as string,
            balance: isNaN(balance) ? 0 : balance
        };

        console.log('[AccountModal] Data to submit:', JSON.stringify(data));
        console.log('[AccountModal] Emitting submit event NOW');

        this.submit.emit(data);

        console.log('[AccountModal] Submit event emitted');
    }

    onClose(): void {
        this.close.emit();
    }
}
