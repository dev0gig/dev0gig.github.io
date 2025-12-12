import { Injectable, inject } from '@angular/core';
import { Account } from '../budget.models';
import { BudgetDataService } from './budget-data.service';
import { BudgetUtilityService } from '../budget.utility.service';

/**
 * BudgetAccountService - Manages account CRUD operations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetAccountService {

    private dataService = inject(BudgetDataService);
    private utilityService = inject(BudgetUtilityService);

    // ==================== Account Selection ====================

    selectAccount(id: string | null) {
        if (this.dataService.selectedAccountId() === id) {
            this.dataService.selectedAccountId.set(null);
        } else {
            this.dataService.selectedAccountId.set(id);
        }
    }

    // ==================== Balance Operations ====================

    updateAccountBalance(accountId: string, delta: number) {
        this.dataService.accounts.update(accounts =>
            accounts.map(a =>
                a.id === accountId ? { ...a, balance: a.balance + delta } : a
            )
        );
    }

    // ==================== CRUD Operations ====================

    addAccount(name: string, balance: number) {
        // Validate data to prevent empty/invalid entries
        if (!name || name.trim() === '') {
            console.warn('addAccount: Invalid data - missing name');
            return;
        }
        if (isNaN(balance) || balance === null || balance === undefined) {
            console.warn('addAccount: Invalid data - invalid balance');
            return;
        }

        const account: Account = {
            id: this.utilityService.generateId(),
            name: name.trim(),
            balance
        };
        this.dataService.accounts.update(a => [...a, account]);
        this.dataService.saveAccounts();
    }

    updateAccount(id: string, name: string, balance: number) {
        this.dataService.accounts.update(accounts =>
            accounts.map(a => a.id === id ? { ...a, name, balance } : a)
        );
        this.dataService.saveAccounts();
    }

    deleteAccount(id: string): boolean {
        this.dataService.accounts.update(a => a.filter(account => account.id !== id));
        this.dataService.saveAccounts();
        if (this.dataService.selectedAccountId() === id) {
            this.selectAccount(null);
        }
        return true;
    }
}
