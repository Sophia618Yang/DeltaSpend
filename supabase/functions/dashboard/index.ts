import {corsHeaders} from '../_shared/cors.ts';
import {requireUser} from '../_shared/auth.ts';

function getRangeBounds(range: string) {
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

function getTrendLabel(date: Date, range: string) {
  return range === 'year'
    ? date.toLocaleString('en-US', {month: 'short'})
    : date.toLocaleString('en-US', {month: 'short', day: 'numeric'});
}

function buildTrend(expenses: any[], range: string) {
  const trendMap = new Map<string, number>();
  const now = new Date();
  const bucketCount = range === 'year' ? 12 : range === 'month' ? 6 : 7;

  for (let index = bucketCount - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    if (range === 'year') {
      date.setMonth(now.getMonth() - index);
    } else if (range === 'month') {
      date.setDate(now.getDate() - index * 5);
    } else {
      date.setDate(now.getDate() - index);
    }
    trendMap.set(getTrendLabel(date, range), 0);
  }

  for (const expense of expenses) {
    const label = getTrendLabel(new Date(expense.spent_at), range);
    trendMap.set(label, (trendMap.get(label) ?? 0) + Number(expense.amount));
  }

  return [...trendMap.entries()].map(([label, amount]) => ({label, amount}));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {user, supabase} = await requireUser(request);
    const url = new URL(request.url);
    const range = url.searchParams.get('range') ?? 'month';
    const {currentStart, previousStart} = getRangeBounds(range);

    const {data: expenses, error} = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('spent_at', previousStart.toISOString())
      .order('spent_at', {ascending: false});
    if (error) throw error;

    const allExpenses = expenses ?? [];
    const current = allExpenses.filter((expense) => new Date(expense.spent_at) >= currentStart);
    const previous = (expenses ?? []).filter((expense) => {
      const spentAt = new Date(expense.spent_at);
      return spentAt >= previousStart && spentAt < currentStart;
    });
    const summaryExpenses = current.length > 0 ? current : allExpenses.slice(0, 30);

    const totalSpent = summaryExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const previousTotal = previous.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const changeVsPrevious = previousTotal === 0 ? 100 : ((totalSpent - previousTotal) / previousTotal) * 100;

    const categoryMap = new Map<string, number>();
    for (const expense of summaryExpenses) {
      categoryMap.set(expense.category, (categoryMap.get(expense.category) ?? 0) + Number(expense.amount));
    }

    return new Response(
      JSON.stringify({
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
        trend: buildTrend(summaryExpenses, range),
        recentExpenses: summaryExpenses.slice(0, 5).map((expense) => ({
          id: expense.id,
          userId: expense.user_id,
          merchant: expense.merchant,
          amount: Number(expense.amount),
          currency: expense.currency,
          category: expense.category,
          spentAt: expense.spent_at,
          sourceType: expense.source_type,
          sourceFileUrl: expense.source_file_url,
          lineItems: expense.line_items ?? [],
          notes: expense.notes,
          isSubscriptionCandidate: expense.is_subscription_candidate,
          createdAt: expense.created_at,
          updatedAt: expense.updated_at,
        })),
      }),
      {status: 200, headers: {...corsHeaders, 'Content-Type': 'application/json'}},
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({error: error instanceof Error ? error.message : 'Unexpected error'}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
