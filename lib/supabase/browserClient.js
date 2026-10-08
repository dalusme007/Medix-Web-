import { createBrowserClient } from "@supabase/ssr";

// Client utilise dans les Client Components ("use client").
// Tous les services (lib/services/*) passent par ici.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
