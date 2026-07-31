export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";

export interface User { id: number; email: string; name: string; created_at: string; }

export interface Account {
  id: number; name: string; type: AccountType;
  balance: number; color: string; icon: string;
  credit_limit: number | null; closing_day: number | null;
  due_day: number | null; invoice_status: string | null;
  created_at: string;
}

export interface Category { id: number; name: string; type: CategoryType; color: string; icon: string; }

export interface Transaction {
  id: number; amount: number; type: TransactionType;
  description: string; date: string; account_id: number;
  destination_account_id: number | null;
  category_id: number | null; category_name: string | null;
  category_icon: string | null; category_color: string | null;
  installment_total: number | null; installment_current: number | null;
  parent_id: number | null; recurrence: string;
  is_paid: boolean; due_date: string | null;
  notes: string | null; attachment_url: string | null;
  created_at: string;
}

export interface Goal {
  id: number; name: string; target_amount: number;
  current_amount: number; deadline: string | null;
  color: string; progress_percent: number; created_at: string;
}
