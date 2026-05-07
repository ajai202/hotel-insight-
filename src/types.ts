export interface Income {
  id?: string;
  date: string;
  source: string;
  amount: number;
  description: string;
  createdBy: string;
}

export interface Expense {
  id?: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  createdBy: string;
}

export interface Admin {
  uid: string;
  email: string;
  role: 'admin';
}

export type ViewState = 'dashboard' | 'income' | 'expenses' | 'prediction' | 'reports';
