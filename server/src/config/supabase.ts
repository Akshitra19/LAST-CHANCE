import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.supabaseConfigured || !env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  supabaseClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
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
    const result = await Promise.race([
      client.storage.listBuckets(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase connectivity check timed out.')), 5_000);
      })
    ]);

    return result.error === null;
  } catch {
    return false;
  }
}
