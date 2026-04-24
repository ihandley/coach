import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getClient() {
    if (cached) return cached;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // allow tests to import safely without crashing
        if (process.env.VITEST) {
            return {} as SupabaseClient;
        }
        throw new Error("Missing Supabase environment variables");
    }

    cached = createClient(supabaseUrl, supabaseKey);
    return cached;
}

export const db = getClient();
