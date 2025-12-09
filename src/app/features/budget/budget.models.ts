/**
 * Budget Models - Interfaces for the Budget feature
 */

export interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category: string;
    account: string;
    toAccount?: string; // For transfers
    date: string;
    isFixedCost?: boolean; // Mark as fixed cost
}

export interface FixedCost {
    id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    account: string;
}

export interface Account {
    id: string;
    name: string;
    balance: number;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
}
