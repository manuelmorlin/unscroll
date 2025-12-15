'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Supabase Browser Client
 * Use this for client-side operations (React components)
 * Includes Realtime capabilities
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for consistent client usage
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}
