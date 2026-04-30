import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function createServerClient(): SupabaseClient {
  const { url, key } = getSupabaseEnv();

  if (!url) {
    throw new Error("Missing Supabase URL for current APP_ENV");
  }

  if (!key) {
    throw new Error("Missing Supabase Service Role Key for current APP_ENV");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
