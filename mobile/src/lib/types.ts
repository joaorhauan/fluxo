export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: number; name: string; type: string;
  balance: number; color: string;
}

export interface Transaction {
  id: number; amount: number; type: TransactionType;
  description: string; date: string;
  account_id: number; category_id: number | null;
  installment_total: number | null; installment_current: number | null;
}

export interface Category {
  id: number; name: string; type: string; color: string;
}

export interface Goal {
  id: number; name: string; target_amount: number;
  current_amount: number; deadline: string | null;
  color: string; progress_percent: number;
}
