export function normalizeMerchant(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-\d+$/, '');
}

export function detectCadence(days: number) {
  if (days >= 25 && days <= 35) return 'monthly';
  if (days >= 6 && days <= 8) return 'weekly';
  if (days >= 360 && days <= 370) return 'yearly';
  return 'unknown';
}

export function buildHeuristicDraft(filePath: string, rawText = '') {
  const merchant =
    filePath.split('/').pop()?.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() ||
    'Uploaded receipt';
  const amount = Math.max(6.5, Number((merchant.length * 1.37).toFixed(2)));
  return {
    isExpenseDocument: true,
    documentType: 'other_expense',
    invalidReason: null,
    merchant,
    amount,
    currency: 'USD',
    date: new Date().toISOString(),
    category:
      merchant.toLowerCase().includes('netflix') || merchant.toLowerCase().includes('spotify')
        ? 'subscription'
        : 'other',
    items: [{name: merchant, amount}],
    confidence: 0.72,
    rawText: rawText || `${merchant}\nTotal ${amount.toFixed(2)} USD`,
  };
}
