import { getSupabaseClient } from "./supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const db = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        const client = getSupabaseClient();
        return (client as any)[prop];
    },
});
