import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Fallback to anon key if service role key is missing to prevent crash, 
// but warn that RLS might block inserts.
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Using Anon Key. RLS policies may block writes.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
