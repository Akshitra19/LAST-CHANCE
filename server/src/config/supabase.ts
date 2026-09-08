import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import { env } from './env.js';

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!env.supabaseConfigured || !env.supabaseUrl || !env.supabaseSecretKey) {
    return null;
  }

  supabaseClient ??= createClient<Database>(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  return supabaseClient;
}

export async function isSupabaseReachable(): Promise<boolean> {
  const client = getSupabaseClient();

  if (!client) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const result = await client
        .from('app_settings')
        .select('singleton_key', { count: 'exact', head: true })
        .limit(1)
        .abortSignal(controller.signal);

      return result.error === null;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}
