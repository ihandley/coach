import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In tests, allow a mock DB instead of crashing import-time
const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;

if (!supabaseUrl || !supabaseKey) {
    if (isTest) {
        // lightweight mock client (tests should stub behavior if needed)
        export const db = {} as any;
    } else {
        throw new Error("Missing Supabase environment variables");
    }
} else {
    export const db = createClient(supabaseUrl, supabaseKey);
}
