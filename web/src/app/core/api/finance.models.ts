/** Espelha os contratos da API (camelCase, enums como texto). */

export type TransactionCategory =
  | 'Income'
  | 'Housing'
  | 'Food'
  | 'Health'
  | 'Transport'
  | 'Leisure'
  | 'Education'
  | 'Transfer'
  | 'Other';

export type TransactionType = 'Credit' | 'Debit';

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  Income: 'Renda',
  Housing: 'Moradia',
  Food: 'Alimentação',
  Health: 'Saúde',
  Transport: 'Transporte',
  Leisure: 'Lazer',
  Education: 'Educação',
  Transfer: 'Transferência',
  Other: 'Outros',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as TransactionCategory[];

export interface AccountInfo {
  accountId: string;
  ownerName: string;
  balance: number;
}

export interface CategoryTotal {
  category: TransactionCategory;
  total: number;
}

export interface DashboardSummary {
  year: number;
  month: number;
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  expensesByCategory: CategoryTotal[];
}

export interface TransactionItem {
  id: string;
  createdAt: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  counterpartyName: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TransferPayload {
  recipientCpf: string;
  amount: number;
  description: string;
  category: TransactionCategory;
}

export interface TransferResult {
  transactionId: string;
  recipientName: string;
  amount: number;
  newBalance: number;
}

export interface StatementFilter {
  from?: string | null;
  to?: string | null;
  category?: TransactionCategory | null;
  page?: number;
  pageSize?: number;
}
