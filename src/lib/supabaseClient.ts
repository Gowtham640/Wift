import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth sync.'
  );
}

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    : null;

function ensureSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return supabase;
}

export type SupabaseSnapshotPayload = Record<string, unknown[]>;
export type SupabaseSnapshotRecord = {
  data: SupabaseSnapshotPayload;
  version: number;
};

export function signInWithGoogle() {
  const client = ensureSupabase();
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined;

  return client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });
}

export function getCurrentUser() {
  return ensureSupabase().auth.getUser();
}

export function fetchUserSnapshot(userId: string) {
  return ensureSupabase()
    .from('user_snapshots')
    .select('data, version')
    .eq('user_id', userId)
    .maybeSingle<SupabaseSnapshotRecord>();
}

export function syncUserSnapshot(
  userId: string,
  payload: SupabaseSnapshotPayload,
  version?: number
) {
  return ensureSupabase()
    .from('user_snapshots')
    .upsert({ user_id: userId, data: payload, version })
    .select('version')
    .single<{ version: number }>();
}

export { supabase };
export const isSupabaseConfigured = Boolean(supabase);
