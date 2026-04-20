import {useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {EmptyState} from '@/src/components/EmptyState';
import {GlassCard} from '@/src/components/GlassCard';
import {UploadDropzone} from '@/src/components/UploadDropzone';
import {useAuth} from '@/src/app/session';
import {useI18n} from '@/src/lib/i18n';
import {EXPENSE_CATEGORIES} from '@/src/lib/constants';
import {useCreateExpense, useCreateParseJob, useDeleteExpense, useExpenses, useParseJob, useUpdateExpense} from '@/src/features/expenses/hooks';
import {compressImageForUpload} from '@/src/lib/images';
import {formatCurrency, formatDateTime} from '@/src/lib/utils';
import type {Expense, ExpenseCategory, ExpenseInput, ParseFlowStatus, ParsedExpenseItem} from '@/src/types';

function toFormState(expense?: Expense): ExpenseInput {
  return {
    merchant: expense?.merchant ?? '',
    amount: expense?.amount ?? 0,
    currency: expense?.currency ?? 'USD',
    category: expense?.category ?? 'other',
    spentAt: expense?.spentAt ?? new Date().toISOString().slice(0, 16),
    sourceType: expense?.sourceType ?? 'manual',
    sourceFileUrl: expense?.sourceFileUrl ?? null,
    notes: expense?.notes ?? '',
  };
}

function buildMergedNotes(form: ExpenseInput, detectedItemsText: string) {
  return [detectedItemsText ? `Items:\n${detectedItemsText}` : '', form.notes ?? '']
    .filter(Boolean)
    .join('\n\n');
}

export function ExpensesPage() {
  const {user} = useAuth();
  const {messages, language} = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseInput>(toFormState());
  const [detectedItemsText, setDetectedItemsText] = useState('');
  const [parsedLineItems, setParsedLineItems] = useState<ParsedExpenseItem[]>([]);
  const [parseFlowStatus, setParseFlowStatus] = useState<ParseFlowStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadedExpenseId, setUploadedExpenseId] = useState<string | null>(null);
  const [parseFlowError, setParseFlowError] = useState<string | null>(null);
  const filters = useMemo(
    () => ({
      category: (searchParams.get('category') as ExpenseCategory | null) ?? 'all',
      keyword: searchParams.get('keyword') ?? '',
      range: 'all' as const,
    }),
    [searchParams],
  );

  const expensesQuery = useExpenses(user!.id, filters);
  const createExpenseMutation = useCreateExpense(user!.id);
  const updateExpenseMutation = useUpdateExpense(user!.id);
  const deleteExpenseMutation = useDeleteExpense(user!.id);
  const createParseJobMutation = useCreateParseJob(user!.id);
  const parseJobQuery = useParseJob(user!.id, jobId);
  const expenses = expensesQuery.data ?? [];
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  useEffect(() => {
    if (parseJobQuery.data?.status === 'completed' && parseFlowStatus === 'parsing') {
      const parsedPayload = parseJobQuery.data.parsedPayload;
      const nextDetectedItemsText = (parsedPayload?.items ?? [])
        .map((item) => `${item.name} — ${item.amount}`)
        .join('\n');
      const nextForm: ExpenseInput = {
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

      setParseFlowStatus('auto_saving');
      setDetectedItemsText(nextDetectedItemsText);
      setParsedLineItems(parsedPayload?.items ?? []);
      setForm(nextForm);

      void createExpenseMutation
        .mutateAsync({
          ...nextForm,
          notes: buildMergedNotes(nextForm, nextDetectedItemsText),
        })
        .then((createdExpense) => {
          setEditingExpense(createdExpense);
          setUploadedExpenseId(createdExpense.id);
          setForm(toFormState(createdExpense));
          setParsedLineItems(createdExpense.lineItems ?? []);
          setParseFlowStatus('review_required');
          setJobId(null);
        })
        .catch(() => {
          setParseFlowError(createExpenseMutation.error?.message ?? null);
          setParseFlowStatus('parse_failed');
        });
    }

    if (parseJobQuery.data?.status === 'failed' && (parseFlowStatus === 'parsing' || parseFlowStatus === 'auto_saving')) {
      setParseFlowError(parseJobQuery.data.errorMessage ?? null);
      setParseFlowStatus('parse_failed');
    }

    if (parseJobQuery.error && (parseFlowStatus === 'parsing' || parseFlowStatus === 'auto_saving')) {
      setParseFlowError(parseJobQuery.error.message);
      setParseFlowStatus('parse_failed');
    }
  }, [createExpenseMutation, parseFlowStatus, parseJobQuery.data, parseJobQuery.error]);

  async function saveExpense() {
    const mergedNotes = buildMergedNotes(form, detectedItemsText);
    if (editingExpense) {
      await updateExpenseMutation.mutateAsync({
        id: editingExpense.id,
        input: {...form, lineItems: parsedLineItems, notes: mergedNotes},
      });
      setEditingExpense(null);
    } else {
      await createExpenseMutation.mutateAsync({...form, lineItems: parsedLineItems, notes: mergedNotes});
    }
    setForm(toFormState());
    setDetectedItemsText('');
    setParsedLineItems([]);
    setUploadedExpenseId(null);
    setParseFlowError(null);
    setParseFlowStatus('save_success');
    setJobId(null);
  }

  async function undoUploadedExpense() {
    if (!editingExpense) return;
    await deleteExpenseMutation.mutateAsync(editingExpense.id);
    setEditingExpense(null);
    setForm(toFormState());
    setDetectedItemsText('');
    setParsedLineItems([]);
    setUploadedExpenseId(null);
    setParseFlowError(null);
    setParseFlowStatus('idle');
    setJobId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{messages.expensesTitle}</h1>
        <p className="mt-1 text-sm text-gray-500">{messages.expensesSubtitle}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <UploadDropzone
            title={messages.uploadReceipt}
            hint={messages.uploadHint}
            busy={parseFlowStatus === 'uploading' || parseFlowStatus === 'parsing' || parseFlowStatus === 'auto_saving'}
            statusText={
              parseFlowStatus === 'uploading'
                ? messages.uploadingStatus
                : parseFlowStatus === 'parsing'
                  ? messages.parsingStatus
                  : parseFlowStatus === 'auto_saving'
                    ? messages.autoSavingStatus
                  : undefined
            }
            onSelect={(file) => {
              setEditingExpense(null);
              setUploadedExpenseId(null);
              setDetectedItemsText('');
              setParsedLineItems([]);
              setParseFlowError(null);
              setParseFlowStatus('uploading');
              void compressImageForUpload(file)
                .then((compressed) => createParseJobMutation.mutateAsync(compressed))
                .then((result) => {
                  setJobId(result.jobId);
                  setParseFlowStatus('parsing');
                })
                .catch((error: unknown) => {
                  setParseFlowError(error instanceof Error ? error.message : String(error ?? 'Parse failed'));
                  setParseFlowStatus('parse_failed');
                });
            }}
          />

          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingExpense ? messages.editExpense : messages.addExpense}
              </h2>
              <button
                className="text-sm text-gray-500"
                onClick={() => {
                  setEditingExpense(null);
                  setForm(toFormState());
                  setDetectedItemsText('');
                  setParsedLineItems([]);
                  setUploadedExpenseId(null);
                  setParseFlowError(null);
                  setParseFlowStatus('idle');
                }}
                type="button"
              >
                {messages.cancel}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">{messages.merchant}</span>
                <input
                  className="w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                  value={form.merchant}
                  onChange={(event) => setForm({...form, merchant: event.target.value})}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{messages.amount}</span>
                <input
                  className="w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({...form, amount: Number(event.target.value)})}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{messages.category}</span>
                <select
                  className="w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                  value={form.category}
                  onChange={(event) => setForm({...form, category: event.target.value as ExpenseCategory})}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {messages.categoryNames[category]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{messages.spentAt}</span>
                <input
                  className="w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                  type="datetime-local"
                  value={form.spentAt.slice(0, 16)}
                  onChange={(event) => setForm({...form, spentAt: new Date(event.target.value).toISOString()})}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{messages.sourceType}</span>
                <select
                  className="w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                  value={form.sourceType}
                  onChange={(event) => setForm({...form, sourceType: event.target.value as ExpenseInput['sourceType']})}
                >
                  <option value="manual">{messages.manual}</option>
                  <option value="upload">{messages.upload}</option>
                </select>
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">{messages.notes}</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                  value={form.notes ?? ''}
                  onChange={(event) => setForm({...form, notes: event.target.value})}
                />
              </label>
              {(parseFlowStatus === 'review_required' || form.sourceType === 'upload') && (
                <label className="space-y-2 sm:col-span-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{messages.detectedItems}</span>
                    <p className="mt-1 text-xs text-gray-500">{messages.detectedItemsHint}</p>
                  </div>
                  <textarea
                    className="min-h-28 w-full rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                    value={detectedItemsText}
                    onChange={(event) => setDetectedItemsText(event.target.value)}
                  />
                </label>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-500">
              {parseFlowStatus === 'uploading' ? <div>{messages.uploadingStatus}</div> : null}
              {parseFlowStatus === 'parsing' ? <div>{messages.parsingStatus}</div> : null}
              {parseFlowStatus === 'auto_saving' ? <div>{messages.autoSavingStatus}</div> : null}
              {parseFlowStatus === 'review_required' ? <div>{messages.parseReady}</div> : null}
              {parseFlowStatus === 'parse_failed' ? (
                <div>
                  {(parseFlowError ?? parseJobQuery.data?.errorMessage) === 'NO_VALID_EXPENSE_FOUND'
                    ? messages.parseInvalid
                    : (parseFlowError ?? parseJobQuery.data?.errorMessage) === 'MODEL_AUTH_FAILED'
                      ? messages.parseModelAuthFailed
                    : parseFlowError ?? messages.parseFailed}
                </div>
              ) : null}
              {createParseJobMutation.error ? (
                <div>
                  {createParseJobMutation.error.message === 'FILE_TOO_LARGE'
                    ? messages.fileTooLarge
                    : createParseJobMutation.error.message === 'NO_VALID_EXPENSE_FOUND'
                      ? messages.parseInvalid
                    : createParseJobMutation.error.message === 'MODEL_AUTH_FAILED'
                      ? messages.parseModelAuthFailed
                    : createParseJobMutation.error.message === 'PARSE_QUOTA_REACHED'
                      ? messages.parseQuota
                      : createParseJobMutation.error.message === 'RATE_LIMITED'
                        ? messages.parseRateLimited
                        : createParseJobMutation.error.message === 'CONCURRENT_LIMIT_REACHED'
                          ? messages.parseConcurrentLimited
                          : createParseJobMutation.error.message === 'UNSUPPORTED_FILE_TYPE'
                            ? messages.parseUnsupported
                            : createParseJobMutation.error.message === 'DUPLICATE_PARSE_REUSED'
                              ? messages.parseDeduped
                              : createParseJobMutation.error.message}
                </div>
              ) : null}
            </div>

            {uploadedExpenseId && editingExpense ? (
              <button
                className="mt-5 w-full rounded-full bg-white px-4 py-3 text-sm font-medium text-gray-900"
                onClick={() => void undoUploadedExpense()}
                type="button"
              >
                {messages.undoUploadedExpense}
              </button>
            ) : null}

            <button
              className="mt-3 w-full rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white"
              onClick={() => void saveExpense()}
              type="button"
            >
              {parseFlowStatus === 'review_required' ? `${messages.reviewDraft} · ${messages.save}` : messages.save}
            </button>
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <input
                className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                placeholder={messages.keyword}
                value={filters.keyword}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('keyword', event.target.value);
                  setSearchParams(next);
                }}
              />
              <select
                className="rounded-2xl bg-white/60 px-4 py-3 outline-none ring-pastel-purple focus:ring-2"
                value={filters.category}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('category', event.target.value);
                  setSearchParams(next);
                }}
              >
                <option value="all">{messages.allCategories}</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {messages.categoryNames[category]}
                  </option>
                ))}
              </select>
            </div>

            {expensesQuery.isLoading ? <div>{messages.loading}</div> : null}
            {!expensesQuery.isLoading && expenses.length === 0 ? (
              <EmptyState title={messages.noExpensesTitle} body={messages.noExpensesBody} />
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="rounded-[1.5rem] bg-white/45 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{expense.merchant}</div>
                        <div className="text-sm text-gray-500">
                          {messages.categoryNames[expense.category]} • {formatDateTime(expense.spentAt, locale)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(expense.amount, expense.currency, locale)}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                            onClick={() => {
                              setEditingExpense(expense);
                              setForm(toFormState(expense));
                              setParsedLineItems(expense.lineItems ?? []);
                            }}
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
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
