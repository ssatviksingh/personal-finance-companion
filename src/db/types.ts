export type TxType = 'income' | 'expense';

export interface CategoryRow {
  id: string;
  name: string;
  type: TxType;
  color: string | null;
  icon_key: string | null;
}

export interface TransactionRow {
  id: string;
  amount_cents: number;
  type: TxType;
  category_id: string;
  occurred_at: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends TransactionRow {
  category_name: string;
  category_color: string | null;
}

export interface MonthlyGoalRow {
  id: string;
  year_month: string;
  target_amount_cents: number;
  created_at: string;
  updated_at: string;
}

export type DatePreset = 'all' | 'week' | 'month' | 'custom';

export interface TransactionFilters {
  search: string;
  type: 'all' | TxType;
  categoryId: string | null;
  datePreset: DatePreset;
  customStart: string | null;
  customEnd: string | null;
}
