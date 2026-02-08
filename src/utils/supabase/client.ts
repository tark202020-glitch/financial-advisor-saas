import { createBrowserClient } from '@supabase/ssr'

// True singleton pattern - create only once
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!supabaseClientInstance) {
        supabaseClientInstance = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        console.log('[SUPABASE] Client created');
    }
    return supabaseClientInstance;
}

// Export the singleton directly
export const supabase = createClient();
