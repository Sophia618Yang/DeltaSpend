import {corsHeaders} from '../_shared/cors.ts';
import {detectCadence, normalizeMerchant} from '../_shared/expense.ts';
import {requireUser} from '../_shared/auth.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {user, supabase} = await requireUser(request);
    const {expenseId} = (await request.json()) as {expenseId?: string};

    let merchantHint: string | null = null;
    if (expenseId) {
      const {data: target, error: targetError} = await supabase
        .from('expenses')
        .select('merchant')
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .single();
      if (targetError) throw targetError;
      merchantHint = target.merchant;
    }

    let query = supabase
      .from('expenses')
      .select('id, merchant, amount, spent_at')
      .eq('user_id', user.id)
      .order('spent_at', {ascending: true});
    if (merchantHint) {
      query = query.ilike('merchant', `%${merchantHint}%`);
    }

    const {data: expenses, error} = await query;
    if (error) throw error;

    const grouped = new Map<string, Array<{id: string; merchant: string; amount: number; spent_at: string}>>();
    for (const expense of expenses ?? []) {
      const key = normalizeMerchant(expense.merchant);
      grouped.set(key, [...(grouped.get(key) ?? []), {id: expense.id, merchant: expense.merchant, amount: Number(expense.amount), spent_at: expense.spent_at}]);
    }

    for (const [normalizedMerchant, entries] of grouped.entries()) {
      if (entries.length < 2) continue;
      const latest = entries[entries.length - 1];
      const previous = entries[entries.length - 2];
      const dayDiff = Math.abs(Math.round((+new Date(latest.spent_at) - +new Date(previous.spent_at)) / 86400000));
      const cadence = detectCadence(dayDiff);
      const amountDelta = Math.abs(latest.amount - previous.amount);
      if (cadence === 'unknown' || amountDelta > Math.max(2, latest.amount * 0.12)) continue;

      const {error: upsertError} = await supabase.from('subscription_candidates').upsert(
        {
          user_id: user.id,
          merchant: latest.merchant,
          normalized_merchant: normalizedMerchant,
          latest_amount: latest.amount,
          cadence_guess: cadence,
          confidence: 0.84,
          status: 'pending',
          source_expense_id: latest.id,
        },
        {onConflict: 'user_id,normalized_merchant'},
      );
      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({ok: true}), {
      status: 200,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({error: error instanceof Error ? error.message : 'Unexpected error'}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
