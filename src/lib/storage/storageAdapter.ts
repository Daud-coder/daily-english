import { StorageAdapter } from "./types";
import { dbAdapter } from "./indexedDB";

/**
 * Storage provider switcher:
 * By default uses IndexedDB for offline-first speed and privacy on mobile.
 * When Supabase is configured in .env (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY),
 * a SupabaseAdapter can be swapped in here seamlessly.
 */
export function getStorage(): StorageAdapter {
  return dbAdapter;
}

export * from "./types";
