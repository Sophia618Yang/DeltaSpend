import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const AUTH_PATH = '/auth';

export function getAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return AUTH_PATH;
  }

  return new URL(AUTH_PATH, window.location.origin).toString();
}

export function hasSupabaseConfig() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
        },
      },
    );
  }

  return client;
}
