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
    note?: string; // Optional note
}

export interface FixedCost {
    id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    account: string;
    toAccount?: string; // For transfers
    groupId?: string; // Group assignment
    order: number; // Sort order
    note?: string; // Optional note
    excludeFromTotal?: boolean; // Exclude from total calculation
}

export interface FixedCostGroup {
    id: string;
    name: string;
    order: number;
    collapsed?: boolean;
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
