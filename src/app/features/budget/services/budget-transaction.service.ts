import { Injectable, inject } from '@angular/core';
import { Transaction } from '../budget.models';
import { BudgetDataService } from './budget-data.service';
import { BudgetAccountService } from './budget-account.service';
import { BudgetUtilityService } from '../budget.utility.service';

/**
 * BudgetTransactionService - Manages transaction CRUD operations and balance calculations
 */
@Injectable({
    providedIn: 'root'
})
export class BudgetTransactionService {

    private dataService = inject(BudgetDataService);
    private accountService = inject(BudgetAccountService);
    private utilityService = inject(BudgetUtilityService);

    // ==================== Balance Operations ====================

    revertTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.accountService.updateAccountBalance(t.account, t.amount); // Add back to source
            this.accountService.updateAccountBalance(t.toAccount, -t.amount); // Deduct from dest
        } else if (t.type === 'income') {
            this.accountService.updateAccountBalance(t.account, -t.amount); // Deduct
        } else {
            this.accountService.updateAccountBalance(t.account, t.amount); // Add back
        }
    }

    applyTransactionBalance(t: Transaction) {
        if (t.type === 'transfer' && t.toAccount) {
            this.accountService.updateAccountBalance(t.account, -t.amount);
            this.accountService.updateAccountBalance(t.toAccount, t.amount);
        } else if (t.type === 'income') {
            this.accountService.updateAccountBalance(t.account, t.amount);
        } else {
            this.accountService.updateAccountBalance(t.account, -t.amount);
        }
    }

    // ==================== CRUD Operations ====================

    addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
        const newTransaction: Transaction = {
            ...transaction,
            id: this.utilityService.generateId()
        };
        this.applyTransactionBalance(newTransaction);
        this.dataService.transactions.update(t => [...t, newTransaction]);
        this.dataService.saveTransactions();
        this.dataService.saveAccounts();
        return newTransaction;
    }

    updateTransaction(id: string, transactionData: Omit<Transaction, 'id'>, oldTransaction: Transaction) {
        const updatedTransaction: Transaction = {
            ...transactionData,
            id
        };
        this.revertTransactionBalance(oldTransaction);
        this.applyTransactionBalance(updatedTransaction);
        this.dataService.transactions.update(t => t.map(item => item.id === id ? updatedTransaction : item));
        this.dataService.saveTransactions();
        this.dataService.saveAccounts();
    }

    deleteTransaction(id: string) {
        const transaction = this.dataService.transactions().find(t => t.id === id);
        if (!transaction) return;

        this.revertTransactionBalance(transaction);
        this.dataService.transactions.update(t => t.filter(item => item.id !== id));
        this.dataService.saveTransactions();
        this.dataService.saveAccounts();
    }

    deleteAllTransactions() {
        // Revert balances for all transactions
        this.dataService.transactions().forEach(t => this.revertTransactionBalance(t));
        // Clear transactions
        this.dataService.transactions.set([]);
        // Save changes
        this.dataService.saveTransactions();
        this.dataService.saveAccounts();
    }
}
