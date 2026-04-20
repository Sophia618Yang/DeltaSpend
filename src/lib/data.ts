import {addDays, differenceInCalendarDays, format, isWithinInterval, startOfDay, startOfMonth, startOfWeek, startOfYear, subDays, subMonths, subWeeks, subYears} from 'date-fns';
import type {
  AppUser,
  DashboardRange,
  DashboardResponse,
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ParseJob,
  ParsedExpenseDraft,
  SubscriptionCandidate,
  TrialReminder,
  TrialReminderInput,
} from '@/src/types';
import {CATEGORY_COLORS, DAILY_PARSE_LIMIT, MAX_IMAGE_SIZE_BYTES, MAX_PDF_SIZE_BYTES, STORAGE_BUCKET} from '@/src/lib/constants';
import {getSupabaseClient, hasSupabaseConfig} from '@/src/lib/supabase';
import {formatDateLabel, slugify, uid} from '@/src/lib/utils';

async function invokeFunction<TResponse>(
  name: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    query?: Record<string, string>;
  },
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const method = options?.method ?? 'POST';
  const query = options?.query ? `?${new URLSearchParams(options.query).toString()}` : '';
  const {
    data: {session},
  } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}${query}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        ...(session?.access_token ? {Authorization: `Bearer ${session.access_token}`} : {}),
      },
      body: method === 'GET' ? undefined : JSON.stringify(options?.body ?? {}),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `Function ${name} failed`);
  }
  return payload as TResponse;
}

interface DataStore {
  user: AppUser | null;
  expenses: Expense[];
  parseJobs: Array<
    ParseJob & {
      userId: string;
      fileName: string;
      fileSize: number;
      fileType: string;
      createdDateKey: string;
      pollingCount: number;
    }
  >;
  subscriptionCandidates: Array<SubscriptionCandidate & {userId: string}>;
  trialReminders: Array<TrialReminder & {userId: string}>;
}

const STORAGE_KEY = 'delta-spend-store-v1';
const SESSION_KEY = 'delta-spend-demo-user';

function createDemoUser(email = 'demo@deltaspnd.app', displayName = 'Demo User'): AppUser {
  return {
    id: 'demo-user',
    email,
    displayName,
    createdAt: new Date().toISOString(),
  };
}

function seedStore(): DataStore {
  return {
    user: null,
    expenses: [],
    parseJobs: [],
    subscriptionCandidates: [],
    trialReminders: [],
  };
}

function readStore(): DataStore {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedStore();
    writeStore(seeded);
    return seeded;
  }

  try {
    return JSON.parse(raw) as DataStore;
  } catch {
    const seeded = seedStore();
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(store: DataStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getRangeBounds(range: DashboardRange) {
  const now = new Date();
  switch (range) {
    case 'day':
      return {currentStart: subDays(now, 1), previousStart: subDays(now, 2)};
    case 'week':
      return {currentStart: subDays(now, 7), previousStart: subDays(now, 14)};
    case 'year':
      return {currentStart: subDays(now, 365), previousStart: subDays(now, 730)};
    case 'month':
    default:
      return {currentStart: subDays(now, 30), previousStart: subDays(now, 60)};
  }
}

function filterExpenses(expenses: Expense[], filters: ExpenseFilters) {
  const keyword = filters.keyword?.trim().toLowerCase();
  return expenses.filter((expense) => {
    if (filters.category && filters.category !== 'all' && expense.category !== filters.category) {
      return false;
    }

    if (keyword) {
      const haystack = `${expense.merchant} ${expense.notes ?? ''}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (filters.range && filters.range !== 'all') {
      const {currentStart} = getRangeBounds(filters.range);
      if (new Date(expense.spentAt) < currentStart) {
        return false;
      }
    }

    return true;
  });
}

function aggregateDashboard(expenses: Expense[], range: DashboardRange): DashboardResponse {
  const {currentStart, previousStart} = getRangeBounds(range);
  const current = expenses.filter((expense) => new Date(expense.spentAt) >= currentStart);
  const previous = expenses.filter(
    (expense) =>
      new Date(expense.spentAt) >= previousStart && new Date(expense.spentAt) < currentStart,
  );
  const summaryExpenses = current.length > 0 ? current : [...expenses].slice(0, 30);
  const totalSpent = summaryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotal = previous.reduce((sum, expense) => sum + expense.amount, 0);
  const changeVsPrevious = previousTotal === 0 ? 100 : ((totalSpent - previousTotal) / previousTotal) * 100;

  const categoryMap = new Map<string, number>();
  for (const expense of summaryExpenses) {
    categoryMap.set(expense.category, (categoryMap.get(expense.category) ?? 0) + expense.amount);
  }

  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, amount]) => ({
      category: category as Expense['category'],
      amount,
      percentage: totalSpent === 0 ? 0 : (amount / totalSpent) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  const trendMap = new Map<string, number>();
  const bucketCount = range === 'year' ? 12 : range === 'month' ? 6 : 7;
  for (let index = bucketCount - 1; index >= 0; index -= 1) {
    const date =
      range === 'year'
        ? subMonths(new Date(), index)
        : range === 'month'
          ? subDays(new Date(), index * 5)
          : subDays(new Date(), index);
    trendMap.set(format(date, range === 'year' ? 'MMM' : 'MMM d'), 0);
  }
  for (const expense of summaryExpenses) {
    const label =
      range === 'year'
        ? format(new Date(expense.spentAt), 'MMM')
        : range === 'month'
          ? format(new Date(expense.spentAt), 'MMM d')
          : format(new Date(expense.spentAt), 'MMM d');
    trendMap.set(label, (trendMap.get(label) ?? 0) + expense.amount);
  }

  return {
    range,
    totalSpent,
    changeVsPrevious,
    categoryBreakdown,
    trend: [...trendMap.entries()].map(([label, amount]) => ({label, amount})),
    recentExpenses: [...expenses]
      .sort((a, b) => +new Date(b.spentAt) - +new Date(a.spentAt))
      .slice(0, 5),
  };
}

function normalizeMerchant(value: string) {
  return slugify(value).replace(/-\d+$/, '');
}

function detectRecurringCandidates(store: DataStore, userId: string) {
  const userExpenses = store.expenses
    .filter((expense) => expense.userId === userId)
    .sort((a, b) => +new Date(a.spentAt) - +new Date(b.spentAt));

  const grouped = new Map<string, Expense[]>();
  for (const expense of userExpenses) {
    const key = normalizeMerchant(expense.merchant);
    grouped.set(key, [...(grouped.get(key) ?? []), expense]);
  }

  for (const [normalizedMerchant, entries] of grouped.entries()) {
    if (entries.length < 2) continue;
    const latest = entries[entries.length - 1];
    const previous = entries[entries.length - 2];
    const days = Math.abs(differenceInCalendarDays(new Date(latest.spentAt), new Date(previous.spentAt)));
    const delta = Math.abs(latest.amount - previous.amount);
    const existing = store.subscriptionCandidates.find(
      (candidate) => normalizeMerchant(candidate.merchant) === normalizedMerchant && candidate.userId === userId,
    );
    if (delta <= Math.max(2, latest.amount * 0.12) && days >= 25 && days <= 35) {
      if (!existing) {
        store.subscriptionCandidates.unshift({
          id: uid('cand'),
          userId,
          merchant: latest.merchant,
          latestAmount: latest.amount,
          cadenceGuess: 'monthly',
          confidence: 0.84,
          status: 'pending',
          sourceExpenseId: latest.id,
        });
      } else if (existing.status === 'pending') {
        existing.latestAmount = latest.amount;
        existing.sourceExpenseId = latest.id;
      }
    }
  }
}

async function uploadToSupabase(userId: string, file: File) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const {error} = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    throw error;
  }
  return filePath;
}

export async function signInWithEmail(email: string, displayName: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const redirectTo = window.location.origin;
    const {error} = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          display_name: displayName,
        },
      },
    });
    if (error) throw error;
    return {mode: 'supabase' as const};
  }

  const user = createDemoUser(email, displayName);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  const store = readStore();
  store.user = user;
  writeStore(store);
  return {mode: 'demo' as const, user};
}

export async function signOutUser() {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data} = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.email) return null;
    const {data: profile} = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    return {
      id: user.id,
      email: user.email,
      displayName:
        profile?.display_name ??
        user.user_metadata.display_name ??
        user.email.split('@')[0],
      createdAt: user.created_at ?? new Date().toISOString(),
    } satisfies AppUser;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AppUser;
}

export function isDemoMode() {
  return !hasSupabaseConfig();
}

export async function listExpenses(userId: string, filters: ExpenseFilters) {
  const supabase = getSupabaseClient();
  if (supabase) {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('spent_at', {ascending: false});
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.keyword?.trim()) {
      query = query.ilike('merchant', `%${filters.keyword.trim()}%`);
    }
    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map(mapExpenseFromRow);
  }

  const store = readStore();
  return filterExpenses(
    store.expenses.filter((expense) => expense.userId === userId),
    filters,
  ).sort((a, b) => +new Date(b.spentAt) - +new Date(a.spentAt));
}

export async function createExpense(userId: string, input: ExpenseInput) {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  if (supabase) {
    const payload = mapExpenseToRow(input, userId);
    const {data, error} = await supabase.from('expenses').insert(payload).select('*').single();
    if (error) throw error;
    void invokeFunction<{ok: boolean}>('sync-subscription-candidates', {
      body: {expenseId: data.id},
    });
    return mapExpenseFromRow(data);
  }

  const store = readStore();
  const expense: Expense = {
    id: uid('exp'),
    userId,
    merchant: input.merchant,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    spentAt: input.spentAt,
    sourceType: input.sourceType,
    sourceFileUrl: input.sourceFileUrl ?? null,
    notes: input.notes ?? null,
    isSubscriptionCandidate: false,
    createdAt: now,
    updatedAt: now,
  };
  store.expenses.unshift(expense);
  detectRecurringCandidates(store, userId);
  writeStore(store);
  return expense;
}

export async function updateExpense(userId: string, id: string, input: ExpenseInput) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data, error} = await supabase
      .from('expenses')
      .update(mapExpenseToRow(input, userId))
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    void invokeFunction<{ok: boolean}>('sync-subscription-candidates', {
      body: {expenseId: data.id},
    });
    return mapExpenseFromRow(data);
  }

  const store = readStore();
  store.expenses = store.expenses.map((expense) =>
    expense.id === id && expense.userId === userId
      ? {...expense, ...input, updatedAt: new Date().toISOString()}
      : expense,
  );
  detectRecurringCandidates(store, userId);
  writeStore(store);
  return store.expenses.find((expense) => expense.id === id)!;
}

export async function deleteExpense(userId: string, id: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {error} = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const store = readStore();
  store.expenses = store.expenses.filter((expense) => !(expense.id === id && expense.userId === userId));
  writeStore(store);
}

export async function getDashboard(userId: string, range: DashboardRange) {
  const supabase = getSupabaseClient();
  if (supabase) {
    return await invokeFunction<DashboardResponse>('dashboard', {
      method: 'GET',
      query: {range},
    });
  }
  const expenses = await listExpenses(userId, {range});
  return aggregateDashboard(expenses, range);
}

export async function createParseExpenseJob(userId: string, file: File) {
  const isPdf = file.type === 'application/pdf';
  const maxSize = isPdf ? MAX_PDF_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSize) {
    throw new Error('FILE_TOO_LARGE');
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const filePath = await uploadToSupabase(userId, file);
    const data = await invokeFunction<{jobId: string}>('parse-expense', {
      body: {filePath},
    });
    return {jobId: data.jobId};
  }

  const store = readStore();
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayCount = store.parseJobs.filter((job) => job.userId === userId && job.createdDateKey === todayKey).length;
  if (todayCount >= DAILY_PARSE_LIMIT) {
    throw new Error('PARSE_QUOTA_REACHED');
  }

  const merchant = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Uploaded receipt';
  const amount = Math.max(6.5, Number((file.size / 90000).toFixed(2)));
  const draft: ParsedExpenseDraft = {
    merchant,
    amount,
    currency: 'USD',
    date: new Date().toISOString(),
    category: merchant.toLowerCase().includes('netflix') ? 'subscription' : 'other',
    items: [{name: merchant, amount}],
    confidence: 0.81,
    rawText: `${merchant}\nTotal ${amount.toFixed(2)} USD`,
  };

  const jobId = uid('job');
  store.parseJobs.unshift({
    id: jobId,
    userId,
    status: 'processing',
    parsedPayload: draft,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    createdDateKey: todayKey,
    pollingCount: 0,
  });
  writeStore(store);
  return {jobId};
}

export async function getParseExpenseJob(userId: string, jobId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data, error} = await supabase
      .from('expense_parse_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      status: data.status,
      parsedPayload: data.parsed_payload ?? null,
      errorMessage: data.error_message ?? null,
      createdAt: data.created_at,
      durationMs: data.duration_ms ?? null,
      totalTokens: data.total_tokens ?? null,
      modelUsed: data.model_used ?? null,
    } satisfies ParseJob;
  }

  const store = readStore();
  const job = store.parseJobs.find((entry) => entry.id === jobId && entry.userId === userId);
  if (!job) {
    throw new Error('Job not found');
  }
  job.pollingCount += 1;
  if (job.pollingCount >= 2 && job.status === 'processing') {
    job.status = 'completed';
  }
  writeStore(store);
  return {
    id: job.id,
    status: job.status,
    parsedPayload: job.parsedPayload ?? null,
    errorMessage: job.errorMessage ?? null,
    createdAt: job.createdAt,
    durationMs: null,
    totalTokens: null,
    modelUsed: null,
  } satisfies ParseJob;
}

export async function listSubscriptionCandidates(userId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data, error} = await supabase
      .from('subscription_candidates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {ascending: false});
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      merchant: row.merchant,
      latestAmount: row.latest_amount,
      cadenceGuess: row.cadence_guess,
      confidence: row.confidence,
      status: row.status,
      sourceExpenseId: row.source_expense_id,
    })) as SubscriptionCandidate[];
  }

  const store = readStore();
  return store.subscriptionCandidates.filter((candidate) => candidate.userId === userId);
}

export async function confirmSubscriptionCandidate(
  userId: string,
  candidateId: string,
  action: 'confirm' | 'dismiss' | 'flag',
) {
  const supabase = getSupabaseClient();
  if (supabase) {
    await invokeFunction<{ok: boolean}>('confirm-subscription-candidate', {
      body: {candidateId, action},
    });
    return;
  }

  const store = readStore();
  store.subscriptionCandidates = store.subscriptionCandidates.map((candidate) => {
    if (candidate.id !== candidateId || candidate.userId !== userId) return candidate;
    return {
      ...candidate,
      status:
        action === 'confirm' ? 'snoozed' : action === 'dismiss' ? 'dismissed' : 'flagged',
    };
  });
  writeStore(store);
}

export async function listTrialReminders(userId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data, error} = await supabase
      .from('trial_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('trial_ends_at', {ascending: true});
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      trialEndsAt: row.trial_ends_at,
      firstChargeAmount: row.first_charge_amount,
      currency: row.currency,
      status: row.status,
    })) as TrialReminder[];
  }

  const store = readStore();
  return store.trialReminders
    .filter((trial) => trial.userId === userId)
    .sort((a, b) => +new Date(a.trialEndsAt) - +new Date(b.trialEndsAt));
}

export async function createTrialReminder(userId: string, input: TrialReminderInput) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data, error} = await supabase
      .from('trial_reminders')
      .insert({
        user_id: userId,
        service_name: input.serviceName,
        trial_ends_at: input.trialEndsAt,
        first_charge_amount: input.firstChargeAmount,
        currency: input.currency,
        status: input.status,
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      serviceName: data.service_name,
      trialEndsAt: data.trial_ends_at,
      firstChargeAmount: data.first_charge_amount,
      currency: data.currency,
      status: data.status,
    } satisfies TrialReminder;
  }

  const store = readStore();
  const reminder: TrialReminder & {userId: string} = {
    id: uid('trial'),
    userId,
    ...input,
  };
  store.trialReminders.unshift(reminder);
  writeStore(store);
  return reminder;
}

export async function updateTrialReminder(userId: string, id: string, input: TrialReminderInput) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {data, error} = await supabase
      .from('trial_reminders')
      .update({
        service_name: input.serviceName,
        trial_ends_at: input.trialEndsAt,
        first_charge_amount: input.firstChargeAmount,
        currency: input.currency,
        status: input.status,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      serviceName: data.service_name,
      trialEndsAt: data.trial_ends_at,
      firstChargeAmount: data.first_charge_amount,
      currency: data.currency,
      status: data.status,
    } satisfies TrialReminder;
  }

  const store = readStore();
  store.trialReminders = store.trialReminders.map((trial) =>
    trial.id === id && trial.userId === userId ? {...trial, ...input} : trial,
  );
  writeStore(store);
  return store.trialReminders.find((trial) => trial.id === id)!;
}

export async function deleteTrialReminder(userId: string, id: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {error} = await supabase.from('trial_reminders').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const store = readStore();
  store.trialReminders = store.trialReminders.filter((trial) => !(trial.id === id && trial.userId === userId));
  writeStore(store);
}

function mapExpenseFromRow(row: any): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    merchant: row.merchant,
    amount: row.amount,
    currency: row.currency,
    category: row.category,
    spentAt: row.spent_at,
    sourceType: row.source_type,
    sourceFileUrl: row.source_file_url,
    lineItems: Array.isArray(row.line_items) ? row.line_items : [],
    notes: row.notes,
    isSubscriptionCandidate: row.is_subscription_candidate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpenseToRow(input: ExpenseInput, userId: string) {
  return {
    user_id: userId,
    merchant: input.merchant,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    spent_at: input.spentAt,
    source_type: input.sourceType,
    source_file_url: input.sourceFileUrl ?? null,
    line_items: input.lineItems ?? [],
    notes: input.notes ?? null,
  };
}

export function getTrialUrgency(trialEndsAt: string) {
  return isWithinInterval(new Date(trialEndsAt), {
    start: startOfDay(new Date()),
    end: addDays(startOfDay(new Date()), 3),
  });
}

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#E5E7EB';
}

export function getRangeSummaryLabel(range: DashboardRange) {
  return range === 'day' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year';
}

export function getExpenseDateLabel(expense: Expense, locale: string) {
  return formatDateLabel(expense.spentAt, locale);
}
