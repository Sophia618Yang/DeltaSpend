import type {DashboardRange, ExpenseCategory} from '@/src/types';

export const DASHBOARD_RANGES: DashboardRange[] = ['day', 'week', 'month', 'year'];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food',
  'groceries',
  'transport',
  'shopping',
  'entertainment',
  'health',
  'travel',
  'utilities',
  'subscription',
  'other',
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#E8D5F5',
  groceries: '#D4F0E7',
  transport: '#FDE8D0',
  shopping: '#DBEAFE',
  entertainment: '#F9E8E8',
  health: '#F9DCC4',
  travel: '#D6E4FF',
  utilities: '#D9F99D',
  subscription: '#FBCFE8',
  other: '#E5E7EB',
};

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

export const DAILY_PARSE_LIMIT = 20;
export const PARSE_RETRY_LIMIT = 2;

export const STORAGE_BUCKET = 'expense-files';
