export type AccountType = 'checking' | 'savings' | 'credit' | 'loan' | 'retirement' | 'hsa';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  userId: string;
  lastUpdated: string;
  currency: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  date: string;
  description: string;
  userId: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number; // Calculated on the fly
  userId: string;
}

export interface Reminder {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  userId: string;
  status: 'pending' | 'paid';
}
