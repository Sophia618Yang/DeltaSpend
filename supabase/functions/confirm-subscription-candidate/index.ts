import {corsHeaders} from '../_shared/cors.ts';
import {normalizeMerchant} from '../_shared/expense.ts';
import {requireUser} from '../_shared/auth.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {user, supabase} = await requireUser(request);
    const {candidateId, action} = (await request.json()) as {
      candidateId: string;
      action: 'confirm' | 'dismiss' | 'flag';
    };

    const {data: candidate, error: fetchError} = await supabase
      .from('subscription_candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single();
    if (fetchError) throw fetchError;

    const nextStatus =
      action === 'confirm' ? 'snoozed' : action === 'dismiss' ? 'dismissed' : 'flagged';

    const {error: updateError} = await supabase
      .from('subscription_candidates')
      .update({status: nextStatus})
      .eq('id', candidateId)
      .eq('user_id', user.id);
    if (updateError) throw updateError;

    if (action === 'confirm') {
      const {error: subscriptionError} = await supabase.from('subscriptions').upsert(
        {
          user_id: user.id,
          merchant: candidate.merchant,
          normalized_merchant: normalizeMerchant(candidate.merchant),
          cadence: candidate.cadence_guess,
          last_amount: candidate.latest_amount,
          status: 'active',
          snoozed_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {onConflict: 'user_id,normalized_merchant'},
      );
      if (subscriptionError) throw subscriptionError;
    }

    return new Response(JSON.stringify({ok: true, status: nextStatus}), {
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
