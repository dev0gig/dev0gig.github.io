// AuriMea Types
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  color: string; // e.g., 'bg-violet-500'
  icon: string; // Material symbol name
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  createdAt: string; // ISO String
  transferId?: string;
}

export interface TransactionTemplate {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
}

export interface Categories {
    income: string[];
    expense: string[];
}