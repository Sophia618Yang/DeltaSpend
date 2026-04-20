import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {ArrowLeft, CalendarDays, Pencil, ReceiptText, Save, UploadCloud} from 'lucide-react';
import {ChartCard} from '@/src/components/ChartCard';
import {EmptyState} from '@/src/components/EmptyState';
import {GlassCard} from '@/src/components/GlassCard';
import {useAuth} from '@/src/app/session';
import {useCreateExpense, useCreateParseJob, useDeleteExpense, useExpenses, useUpdateExpense, useParseJob} from '@/src/features/expenses/hooks';
import {useDashboard} from '@/src/features/dashboard/hooks';
import {EXPENSE_CATEGORIES} from '@/src/lib/constants';
import {compressImageForUpload} from '@/src/lib/images';
import {useI18n} from '@/src/lib/i18n';
import {getCategoryColor} from '@/src/lib/data';
import {cn, formatCurrency, formatDateTime} from '@/src/lib/utils';
import type {DashboardResponse, Expense, ExpenseCategory, ExpenseInput, ParseFlowStatus, ParsedExpenseItem} from '@/src/types';

function buildMergedNotes(form: ExpenseInput) {
  return form.notes ?? '';
}

function toFormState(expense?: Expense): ExpenseInput {
  return {
    merchant: expense?.merchant ?? '',
    amount: expense?.amount ?? 0,
    currency: expense?.currency ?? 'USD',
    category: expense?.category ?? 'other',
    spentAt: expense?.spentAt ?? new Date().toISOString(),
    sourceType: expense?.sourceType ?? 'manual',
    sourceFileUrl: expense?.sourceFileUrl ?? null,
    lineItems: expense?.lineItems ?? [],
    notes: expense?.notes ?? '',
  };
}

function emptyDashboard(range: DashboardResponse['range']): DashboardResponse {
  return {
    range,
    totalSpent: 0,
    changeVsPrevious: 0,
    categoryBreakdown: [],
    trend: [],
    recentExpenses: [],
  };
}

function getRollingRangeBounds(range: DashboardResponse['range']) {
  const now = new Date();
  const currentStart = new Date(now);
  const previousStart = new Date(now);
  if (range === 'day') {
    currentStart.setDate(now.getDate() - 1);
    previousStart.setDate(now.getDate() - 2);
  } else if (range === 'week') {
    currentStart.setDate(now.getDate() - 7);
    previousStart.setDate(now.getDate() - 14);
  } else if (range === 'year') {
    currentStart.setDate(now.getDate() - 365);
    previousStart.setDate(now.getDate() - 730);
  } else {
    currentStart.setDate(now.getDate() - 30);
    previousStart.setDate(now.getDate() - 60);
  }
  return {currentStart, previousStart};
}

function getTrendLabel(date: Date, range: DashboardResponse['range']) {
  return range === 'year'
    ? date.toLocaleString('en-US', {month: 'short'})
    : date.toLocaleString('en-US', {month: 'short', day: 'numeric'});
}

function buildDashboardFromExpenses(expenses: Expense[], range: DashboardResponse['range']): DashboardResponse {
  const positiveExpenses = expenses.filter((expense) => expense.amount > 0);
  const {currentStart, previousStart} = getRollingRangeBounds(range);
  const current = positiveExpenses.filter((expense) => new Date(expense.spentAt) >= currentStart);
  const previous = positiveExpenses.filter((expense) => {
    const spentAt = new Date(expense.spentAt);
    return spentAt >= previousStart && spentAt < currentStart;
  });
  const summaryExpenses = current.length > 0 ? current : positiveExpenses.slice(0, 30);
  const totalSpent = summaryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotal = previous.reduce((sum, expense) => sum + expense.amount, 0);
  const changeVsPrevious = previousTotal === 0 ? 100 : ((totalSpent - previousTotal) / previousTotal) * 100;

  const categoryMap = new Map<ExpenseCategory, number>();
  const trendMap = new Map<string, number>();
  for (const expense of summaryExpenses) {
    categoryMap.set(expense.category, (categoryMap.get(expense.category) ?? 0) + expense.amount);
    const label = getTrendLabel(new Date(expense.spentAt), range);
    trendMap.set(label, (trendMap.get(label) ?? 0) + expense.amount);
  }

  return {
    range,
    totalSpent,
    changeVsPrevious,
    categoryBreakdown: [...categoryMap.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent === 0 ? 0 : (amount / totalSpent) * 100,
      }))
      .sort((a, b) => b.amount - a.amount),
    trend: [...trendMap.entries()]
      .map(([label, amount]) => ({label, amount}))
      .reverse(),
    recentExpenses: summaryExpenses.slice(0, 5),
  };
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <GlassCard className="min-h-[12rem] bg-white/68">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-3 text-5xl font-black tracking-[-0.04em] text-gray-900">{value}</div>
      <div className="mt-3 text-sm text-gray-500">{hint}</div>
    </GlassCard>
  );
}

function EmptyChart({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid h-[18rem] place-items-center rounded-[2rem] border border-dashed border-white/70 bg-white/35 text-center">
      <div className="space-y-2 px-6">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {children}
      </div>
    </div>
  );
}

function formatItemMeta(item: ParsedExpenseItem, quantityUnitLabel: string) {
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const unitPrice = item.unitPrice && item.unitPrice > 0 ? item.unitPrice : item.amount;
  return `${quantity} ${quantityUnitLabel} • ${formatCurrency(unitPrice)} each`;
}

function sanitizeLineItems(items: ParsedExpenseItem[]) {
  return items
    .map((item) => ({
      name: item.name.trim(),
      amount: item.amount,
      quantity: item.quantity ?? null,
      unitPrice: item.unitPrice ?? null,
    }))
    .filter((item) => item.name.length > 0);
}

export function DashboardPage() {
  const {user} = useAuth();
  const {messages, language} = useI18n();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  const dashboardQuery = useDashboard(user!.id, 'month');
  const [expenseFilters, setExpenseFilters] = useState<{keyword: string; category: ExpenseCategory | 'all'}>({
    keyword: '',
    category: 'all',
  });
  const expensesQuery = useExpenses(user!.id, {
    keyword: expenseFilters.keyword,
    category: expenseFilters.category,
    range: 'all',
  });
  const createParseJobMutation = useCreateParseJob(user!.id);
  const createExpenseMutation = useCreateExpense(user!.id);
  const updateExpenseMutation = useUpdateExpense(user!.id);
  const deleteExpenseMutation = useDeleteExpense(user!.id);

  const [parseFlowStatus, setParseFlowStatus] = useState<ParseFlowStatus>('idle');
  const [parseFlowError, setParseFlowError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [scanDraft, setScanDraft] = useState<ExpenseInput | null>(null);
  const [lineItems, setLineItems] = useState<ParsedExpenseItem[]>([]);
  const [savedExpenseId, setSavedExpenseId] = useState<string | null>(null);
  const [isEditingScan, setIsEditingScan] = useState(false);

  const parseJobQuery = useParseJob(user!.id, jobId);
  const expenses = expensesQuery.data ?? [];
  const fallbackDashboard = useMemo(() => buildDashboardFromExpenses(expenses, 'month'), [expenses]);
  const remoteDashboard = dashboardQuery.data ?? emptyDashboard('month');
  const remoteHasAnalytics =
    remoteDashboard.totalSpent > 0 ||
    remoteDashboard.categoryBreakdown.length > 0 ||
    remoteDashboard.trend.some((point) => point.amount > 0);
  const dashboard = remoteHasAnalytics ? remoteDashboard : fallbackDashboard;
  const hasDashboardData = dashboard.totalSpent > 0 || dashboard.recentExpenses.length > 0;
  const isReviewingScan = scanDraft !== null;

  useEffect(() => {
    if (parseJobQuery.data?.status === 'completed' && parseFlowStatus === 'parsing') {
      const parsedPayload = parseJobQuery.data.parsedPayload;
      const nextDraft: ExpenseInput = {
        merchant: parsedPayload?.merchant ?? '',
        amount: parsedPayload?.amount ?? 0,
        currency: parsedPayload?.currency ?? 'USD',
        category: parsedPayload?.category ?? 'other',
        spentAt: parsedPayload?.date ?? new Date().toISOString(),
        sourceType: 'upload',
        sourceFileUrl: null,
        lineItems: parsedPayload?.items ?? [],
        notes: parsedPayload?.rawText ?? '',
      };
      const nextLineItems = parsedPayload?.items ?? [];

      setScanDraft(nextDraft);
      setLineItems(nextLineItems);
      setIsEditingScan(false);
      setParseFlowStatus('auto_saving');

      void createExpenseMutation
        .mutateAsync({
          ...nextDraft,
          lineItems: sanitizeLineItems(nextLineItems),
          notes: buildMergedNotes(nextDraft),
        })
        .then(async (createdExpense) => {
          setSavedExpenseId(createdExpense.id);
          setScanDraft(toFormState(createdExpense));
          setLineItems(createdExpense.lineItems ?? []);
          setParseFlowStatus('review_required');
          setJobId(null);
          await Promise.all([dashboardQuery.refetch(), expensesQuery.refetch()]);
        })
        .catch((error: unknown) => {
          setParseFlowError(error instanceof Error ? error.message : String(error ?? 'Auto-save failed'));
          setParseFlowStatus('parse_failed');
          setJobId(null);
        });
    }

    if (parseJobQuery.data?.status === 'failed' && (parseFlowStatus === 'parsing' || parseFlowStatus === 'auto_saving')) {
      setParseFlowError(parseJobQuery.data.errorMessage ?? null);
      setParseFlowStatus('parse_failed');
      setJobId(null);
    }

    if (parseJobQuery.error && (parseFlowStatus === 'parsing' || parseFlowStatus === 'auto_saving')) {
      setParseFlowError(parseJobQuery.error.message);
      setParseFlowStatus('parse_failed');
      setJobId(null);
    }
  }, [createExpenseMutation, dashboardQuery, expensesQuery, parseFlowStatus, parseJobQuery.data, parseJobQuery.error]);

  const deltaIndex = hasDashboardData ? `${(-dashboard.changeVsPrevious).toFixed(1)}%` : messages.emptyMetric;

  const uploadStatusText = useMemo(() => {
    if (parseFlowStatus === 'uploading') return messages.uploadingStatus;
    if (parseFlowStatus === 'parsing') return messages.parsingStatus;
    if (parseFlowStatus === 'auto_saving') return messages.autoSavingStatus;
    if (parseFlowStatus === 'parse_failed') {
      if (parseFlowError === 'NO_VALID_EXPENSE_FOUND') return messages.parseInvalid;
      if (parseFlowError === 'MODEL_AUTH_FAILED') return messages.parseModelAuthFailed;
      if (parseFlowError === 'RATE_LIMITED') return messages.parseRateLimited;
      return parseFlowError ?? messages.parseFailed;
    }
    return messages.dropReceiptHere;
  }, [messages, parseFlowError, parseFlowStatus]);

  function resetScanState() {
    setScanDraft(null);
    setLineItems([]);
    setSavedExpenseId(null);
    setIsEditingScan(false);
    setParseFlowError(null);
    setParseFlowStatus('idle');
    setJobId(null);
  }

  async function handleUpload(file: File) {
    resetScanState();
    setParseFlowStatus('uploading');
    try {
      const compressed = await compressImageForUpload(file);
      const result = await createParseJobMutation.mutateAsync(compressed);
      setJobId(result.jobId);
      setParseFlowStatus('parsing');
    } catch (error) {
      setParseFlowError(error instanceof Error ? error.message : String(error ?? 'Parse failed'));
      setParseFlowStatus('parse_failed');
    }
  }

  async function saveToLedger() {
    if (!scanDraft) return;
    const isNewExpense = !savedExpenseId;
    const nextLineItems = sanitizeLineItems(lineItems);
    const payload: ExpenseInput = {
      ...scanDraft,
      lineItems: nextLineItems,
      notes: buildMergedNotes(scanDraft),
    };

    if (savedExpenseId) {
      await updateExpenseMutation.mutateAsync({id: savedExpenseId, input: payload});
    } else {
      const created = await createExpenseMutation.mutateAsync(payload);
      setSavedExpenseId(created.id);
    }
    setLineItems(nextLineItems);
    setIsEditingScan(false);

    await Promise.all([dashboardQuery.refetch(), expensesQuery.refetch()]);
    if (isNewExpense) {
      resetScanState();
    }
  }

  function startManualEntry() {
    setScanDraft({
      merchant: '',
      amount: 0,
      currency: 'USD',
      category: 'other',
      spentAt: new Date().toISOString(),
      sourceType: 'manual',
      sourceFileUrl: null,
      lineItems: [],
      notes: '',
    });
    setLineItems([]);
    setSavedExpenseId(null);
    setParseFlowError(null);
    setParseFlowStatus('idle');
    setJobId(null);
    setIsEditingScan(true);
  }

  function addLineItem() {
    setLineItems((current) => [...current, {name: '', amount: 0, quantity: 1, unitPrice: 0}]);
  }

  function openExpenseDetails(expense: Expense, editing = false) {
    setScanDraft(toFormState(expense));
    setLineItems(expense.lineItems ?? []);
    setSavedExpenseId(expense.id);
    setParseFlowError(null);
    setParseFlowStatus('idle');
    setJobId(null);
    setIsEditingScan(editing);
  }

  function renderDashboard() {
    const isRefreshing = dashboardQuery.isFetching || expensesQuery.isFetching;

    return (
      <div className="space-y-6">
        {isRefreshing ? <div className="text-sm text-gray-400">{messages.loading}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.95fr]">
          <MetricTile
            label={messages.totalSpentThisMonth}
            value={hasDashboardData ? formatCurrency(dashboard.totalSpent, 'USD', locale) : messages.emptyMetric}
            hint={hasDashboardData ? `${dashboard.changeVsPrevious.toFixed(1)}% ${messages.changeVsPrevious}` : messages.uploadToSeeCharts}
          />
          <MetricTile
            label={messages.deltaIndex}
            value={deltaIndex}
            hint={hasDashboardData ? (dashboard.changeVsPrevious <= 0 ? messages.deltaInsightLower : messages.deltaInsightHigher) : messages.uploadToSeeCharts}
          />

          <div className="space-y-3">
            <label
              className={cn(
                'blob-4 relative block min-h-[15.5rem] cursor-pointer overflow-hidden border-2 border-white/60 bg-[#FDE8D0] px-6 py-10 text-center shadow-xl transition-transform hover:scale-[1.02]',
                (parseFlowStatus === 'uploading' || parseFlowStatus === 'parsing') && 'pointer-events-none opacity-80',
              )}
            >
              <input
                className="hidden"
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                  event.currentTarget.value = '';
                }}
              />
              <div className="absolute inset-0 bg-white/20 transition-colors hover:bg-white/30" />
              <div className="relative z-10 mx-auto flex w-[82%] flex-col items-center">
              <div className="blob-1 mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/90 text-gray-900 shadow-sm backdrop-blur-sm">
                <UploadCloud size={22} />
              </div>
              <div className="mt-5 text-2xl font-black tracking-[-0.03em] text-gray-900">{messages.aiAutoEntry}</div>
              <div className="mt-2 text-sm text-gray-600">{uploadStatusText}</div>
              {parseFlowStatus === 'parse_failed' ? (
                <div className="mt-4 rounded-2xl bg-pastel-pink/90 px-4 py-3 text-sm font-medium text-gray-700">
                  {uploadStatusText}
                </div>
              ) : null}
              </div>
            </label>

            <button
              className="glass-panel w-full rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-gray-800"
              onClick={startManualEntry}
              type="button"
            >
              + {messages.manualEntryCta}
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
          <ChartCard title={messages.spendingTrends}>
            {hasDashboardData ? (
              <div className="h-[18rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboard.trend}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, 'USD', locale)} />
                    <Line dataKey="amount" type="monotone" stroke="#E8D5F5" strokeWidth={3} dot={{r: 4, fill: '#E8D5F5'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label={messages.chartEmptyHint} />
            )}
          </ChartCard>

          <ChartCard title={messages.categories}>
            {hasDashboardData ? (
              <div className="space-y-5">
                <div className="relative h-[14rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboard.categoryBreakdown} dataKey="amount" innerRadius={42} outerRadius={70} paddingAngle={4}>
                        {dashboard.categoryBreakdown.map((item) => (
                          <Cell key={item.category} fill={getCategoryColor(item.category)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-2xl font-black tracking-[-0.03em] text-gray-900">
                    {messages.topCategories}
                  </div>
                </div>
                <div className="space-y-3">
                  {dashboard.categoryBreakdown.slice(0, 5).map((item) => (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/45 px-3 py-2" key={item.category}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 rounded-full"
                          style={{backgroundColor: getCategoryColor(item.category)}}
                        />
                        <span className="truncate text-sm font-semibold text-gray-800">{messages.categoryNames[item.category]}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-gray-900">{item.percentage.toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">{formatCurrency(item.amount, 'USD', locale)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart label={messages.categoryEmptyHint}>
                <div className="mx-auto mt-3 grid h-28 w-28 place-items-center rounded-full border-[14px] border-pastel-purple/40 text-lg font-black text-gray-700">
                  {messages.topCategories}
                </div>
              </EmptyChart>
            )}
          </ChartCard>
        </div>

        <ChartCard title={messages.recentTransactions}>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
              <input
                className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                placeholder={messages.keyword}
                value={expenseFilters.keyword}
                onChange={(event) => setExpenseFilters((current) => ({...current, keyword: event.target.value}))}
              />
              <select
                className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                value={expenseFilters.category}
                onChange={(event) =>
                  setExpenseFilters((current) => ({...current, category: event.target.value as ExpenseCategory | 'all'}))
                }
              >
                <option value="all">{messages.allCategories}</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {messages.categoryNames[category]}
                  </option>
                ))}
              </select>
            </div>

            {expensesQuery.isLoading ? <div className="text-sm text-gray-500">{messages.loading}</div> : null}
            {!expensesQuery.isLoading && expenses.length === 0 ? (
              <EmptyState title={messages.noExpensesTitle} body={messages.noExpensesBody} />
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="rounded-[1.75rem] bg-white/45 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button className="min-w-0 flex-1 text-left" onClick={() => openExpenseDetails(expense)} type="button">
                        <div className="text-2xl font-black tracking-[-0.03em] text-gray-900">{expense.merchant}</div>
                        <div className="mt-1 text-sm text-gray-500">
                          {messages.categoryNames[expense.category]} • {formatDateTime(expense.spentAt, locale)}
                        </div>
                      </button>
                      <div className="text-right">
                        <div className="text-2xl font-black tracking-[-0.03em] text-gray-900">
                          {formatCurrency(expense.amount, expense.currency, locale)}
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                            onClick={() => openExpenseDetails(expense)}
                            type="button"
                          >
                            {messages.viewDetails}
                          </button>
                          <button
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                            onClick={() => openExpenseDetails(expense, true)}
                            type="button"
                          >
                            {messages.editExpense}
                          </button>
                          <button
                            className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
                            onClick={() => void deleteExpenseMutation.mutateAsync(expense.id)}
                            type="button"
                          >
                            {messages.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    );
  }

  function renderScanComplete() {
    if (!scanDraft) return null;
    const lineItemsToRender = lineItems.length > 0 ? lineItems : scanDraft.lineItems ?? [];
    const ledgerActionLabel = savedExpenseId ? (isEditingScan ? messages.updateLedger : messages.savedToLedger) : messages.saveToLedger;
    const ledgerActionDisabled = Boolean(savedExpenseId && !isEditingScan);
    const isManualEntry = scanDraft.sourceType === 'manual' && !savedExpenseId;
    const isSavedDetails = Boolean(savedExpenseId && !isEditingScan);
    const headerTitle = isManualEntry
      ? messages.manualEntryTitle
      : isSavedDetails
        ? messages.expenseDetails
        : savedExpenseId
          ? messages.editExpense
          : messages.scanComplete;
    const headerSubtitle = isManualEntry
      ? messages.manualEntryStructured
      : isSavedDetails
        ? messages.expenseDetailsStructured
        : messages.scanStructured;
    const secondaryActionLabel = isSavedDetails || isManualEntry ? messages.close : messages.retry;

    return (
      <div className="space-y-6">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-gray-700"
          onClick={resetScanState}
          type="button"
        >
          <ArrowLeft size={16} />
          {messages.backToDashboard}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-pastel-mint text-gray-800">
                <ReceiptText size={18} />
              </div>
              <div>
                <div className="text-4xl font-black tracking-[-0.04em] text-gray-900">{headerTitle}</div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">{headerSubtitle}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="glass-panel inline-flex items-center gap-2 rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-gray-700"
              onClick={() => setIsEditingScan((current) => !current)}
              type="button"
            >
              <Pencil size={16} />
              {isEditingScan ? messages.done : messages.edit}
            </button>
            <button
              className="rounded-2xl bg-pastel-blue px-5 py-3 text-sm font-semibold text-gray-900"
              onClick={resetScanState}
              type="button"
            >
              {secondaryActionLabel}
            </button>
          </div>
        </div>

        <GlassCard className="scan-surface p-8 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-5">
              <div className="inline-flex rounded-full bg-pastel-purple px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-800">
                <select
                  className="bg-transparent text-sm font-bold uppercase tracking-[0.12em] text-gray-800 outline-none"
                  value={scanDraft.category}
                  onChange={(event) => setScanDraft({...scanDraft, category: event.target.value as ExpenseCategory})}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {messages.categoryNames[category]}
                    </option>
                  ))}
                </select>
              </div>
              {isEditingScan ? (
                <input
                  className="w-full rounded-2xl bg-white/70 px-4 py-3 text-4xl font-black tracking-[-0.04em] text-gray-900 outline-none ring-pastel-purple focus:ring-2"
                  value={scanDraft.merchant}
                  onChange={(event) => setScanDraft({...scanDraft, merchant: event.target.value})}
                />
              ) : (
                <div className="text-5xl font-black tracking-[-0.05em] text-gray-900">{scanDraft.merchant}</div>
              )}

              <div className="flex items-center gap-2 text-lg text-gray-500">
                <CalendarDays size={18} />
                {isEditingScan ? (
                  <input
                    className="rounded-xl bg-white/70 px-3 py-2 outline-none ring-pastel-purple focus:ring-2"
                    type="date"
                    value={scanDraft.spentAt.slice(0, 10)}
                    onChange={(event) => setScanDraft({...scanDraft, spentAt: new Date(event.target.value).toISOString()})}
                  />
                ) : (
                  formatDateTime(scanDraft.spentAt, locale)
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-pastel-blue/90 px-8 py-8 text-right shadow-inner">
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-gray-500">{messages.totalAmountLabel}</div>
              {isEditingScan ? (
                <input
                  className="mt-3 w-40 rounded-2xl bg-white/80 px-4 py-3 text-right text-5xl font-black tracking-[-0.05em] text-gray-900 outline-none ring-pastel-blue focus:ring-2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={scanDraft.amount}
                  onChange={(event) => setScanDraft({...scanDraft, amount: Number(event.target.value)})}
                />
              ) : (
                <div className="mt-3 text-6xl font-black tracking-[-0.06em] text-gray-900">
                  {formatCurrency(scanDraft.amount, scanDraft.currency, locale)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200/70 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">{messages.itemizedBreakdown}</div>
                <div className="mt-2 text-sm text-gray-500">{messages.itemizedOptionalHint}</div>
              </div>
              {isEditingScan ? (
                <button
                  className="rounded-full bg-pastel-mint px-4 py-2 text-sm font-semibold text-gray-800"
                  onClick={addLineItem}
                  type="button"
                >
                  + {messages.addLineItem}
                </button>
              ) : null}
            </div>
            <div className="mt-6 space-y-8">
              {lineItemsToRender.length === 0 ? (
                <div className="rounded-[1.5rem] bg-white/45 px-5 py-6 text-sm text-gray-500">{messages.itemizedOptionalHint}</div>
              ) : null}
              {lineItemsToRender.map((item, index) => (
                <div className="flex items-start justify-between gap-6" key={`${item.name}-${index}`}>
                  <div className="min-w-0 flex-1">
                    {isEditingScan ? (
                      <div className="grid gap-3 md:grid-cols-[1.4fr_0.55fr_0.7fr_0.7fr_auto]">
                        <input
                          className="rounded-2xl bg-white/70 px-4 py-3 font-bold text-gray-900 outline-none ring-pastel-purple focus:ring-2"
                          placeholder={messages.itemName}
                          value={item.name}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((entry, itemIndex) => (itemIndex === index ? {...entry, name: event.target.value} : entry)),
                            )
                          }
                        />
                        <input
                          className="rounded-2xl bg-white/70 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity ?? 1}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((entry, itemIndex) =>
                                itemIndex === index ? {...entry, quantity: Number(event.target.value)} : entry,
                              ),
                            )
                          }
                        />
                        <input
                          className="rounded-2xl bg-white/70 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={messages.unitPrice}
                          value={item.unitPrice ?? item.amount}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((entry, itemIndex) =>
                                itemIndex === index ? {...entry, unitPrice: Number(event.target.value)} : entry,
                              ),
                            )
                          }
                        />
                        <input
                          className="rounded-2xl bg-white/70 px-4 py-3 font-semibold outline-none ring-pastel-purple focus:ring-2"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={messages.lineTotal}
                          value={item.amount}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((entry, itemIndex) =>
                                itemIndex === index ? {...entry, amount: Number(event.target.value)} : entry,
                              ),
                            )
                          }
                        />
                        <button
                          className="rounded-full bg-pastel-pink px-3 py-2 text-sm font-medium text-gray-700"
                          onClick={() =>
                            setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                          }
                          type="button"
                        >
                          {messages.removeLineItem}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-black tracking-[-0.03em] text-gray-900">{item.name}</div>
                        <div className="mt-2 text-base text-gray-400">{formatItemMeta(item, messages.quantityUnitFormat)}</div>
                      </>
                    )}
                  </div>

                  {!isEditingScan ? (
                    <div className="space-y-3 text-right">
                      <div className="text-3xl font-black tracking-[-0.03em] text-gray-900">{formatCurrency(item.amount, scanDraft.currency, locale)}</div>
                      <div className="inline-flex rounded-full bg-pastel-purple/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gray-700">
                        STD: {formatCurrency(item.unitPrice ?? item.amount, scanDraft.currency, locale)}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <button
          className={cn(
            'w-full rounded-[2rem] px-6 py-5 text-lg font-bold transition',
            ledgerActionDisabled
              ? 'cursor-default bg-pastel-mint text-gray-800 shadow-[0_18px_50px_rgba(212,240,231,0.45)]'
              : 'bg-pastel-purple text-gray-900 shadow-[0_18px_50px_rgba(232,213,245,0.55)]',
          )}
          disabled={ledgerActionDisabled}
          onClick={() => void saveToLedger()}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Save size={18} />
            {ledgerActionLabel}
          </span>
        </button>
      </div>
    );
  }

  return isReviewingScan ? renderScanComplete() : renderDashboard();
}
