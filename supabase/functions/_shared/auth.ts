import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {auth: {persistSession: false}},
  );
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    throw new Response(JSON.stringify({error: 'Missing auth header'}), {
      status: 401,
      headers: {'Content-Type': 'application/json'},
    });
  }

  const token = authorization.replace('Bearer ', '');
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')!}/auth/v1/user`, {
    headers: {
      apikey: Deno.env.get('SUPABASE_ANON_KEY')!,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Response(JSON.stringify({error: payload.message ?? payload.error ?? 'Unauthorized'}), {
      status: 401,
      headers: {'Content-Type': 'application/json'},
    });
  }

  const user = await response.json();
  return {user, supabase: createAdminClient()};
}
