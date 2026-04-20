export type AppLanguage = 'en' | 'zh';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type ParseFlowStatus =
  | 'uploading'
  | 'parsing'
  | 'auto_saving'
  | 'review_required'
  | 'save_success'
  | 'parse_failed';

export type DashboardRange = 'day' | 'week' | 'month' | 'year';

export type ExpenseSourceType = 'manual' | 'upload';

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'travel'
  | 'utilities'
  | 'subscription'
  | 'other';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  merchant: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  spentAt: string;
  sourceType: ExpenseSourceType;
  sourceFileUrl?: string | null;
  lineItems?: ParsedExpenseItem[];
  notes?: string | null;
  isSubscriptionCandidate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedExpenseItem {
  name: string;
  amount: number;
  quantity?: number | null;
  unitPrice?: number | null;
}

export interface ParsedExpenseDraft {
  isExpenseDocument?: boolean;
  documentType?:
    | 'grocery_receipt'
    | 'restaurant_receipt'
    | 'bank_statement'
    | 'ecommerce_screenshot'
    | 'other_expense'
    | 'invalid';
  invalidReason?: string | null;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: ExpenseCategory;
  items: ParsedExpenseItem[];
  confidence: number;
  rawText: string;
}

export interface DashboardCategoryBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
}

export interface DashboardTrendPoint {
  label: string;
  amount: number;
}

export interface DashboardResponse {
  range: DashboardRange;
  totalSpent: number;
  changeVsPrevious: number;
  categoryBreakdown: DashboardCategoryBreakdownItem[];
  trend: DashboardTrendPoint[];
  recentExpenses: Expense[];
}

export type SubscriptionCandidateStatus = 'pending' | 'confirmed' | 'dismissed' | 'flagged' | 'snoozed';

export interface SubscriptionCandidate {
  id: string;
  merchant: string;
  latestAmount: number;
  cadenceGuess: string;
  confidence: number;
  status: SubscriptionCandidateStatus;
  sourceExpenseId: string;
}

export interface TrialReminder {
  id: string;
  serviceName: string;
  trialEndsAt: string;
  firstChargeAmount: number;
  currency: string;
  status: 'active' | 'cancelled';
}

export interface ParseJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parsedPayload?: ParsedExpenseDraft | null;
  errorMessage?: string | null;
  createdAt: string;
  durationMs?: number | null;
  totalTokens?: number | null;
  modelUsed?: string | null;
}

export interface ExpenseFilters {
  range?: DashboardRange | 'all';
  category?: ExpenseCategory | 'all';
  keyword?: string;
}

export interface ExpenseInput {
  merchant: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  spentAt: string;
  sourceType: ExpenseSourceType;
  sourceFileUrl?: string | null;
  lineItems?: ParsedExpenseItem[];
  notes?: string | null;
}

export interface TrialReminderInput {
  serviceName: string;
  trialEndsAt: string;
  firstChargeAmount: number;
  currency: string;
  status: 'active' | 'cancelled';
}
