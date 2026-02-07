import { createClient } from '@supabase/supabase-js';

// Create a local instance for backend operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface KisTokenRecord {
    id: number;
    token: string;
    expires_at: string;
}

/**
 * Retrieves a valid token from Supabase if it exists and hasn't expired.
 * We add a 5-minute buffer safely.
 */
export async function getStoredToken(): Promise<string | null> {
    try {
        const now = new Date();
        const bufferTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 min buffer

        // Select the latest valid token
        const { data, error } = await supabase
            .from('kis_tokens')
            .select('token, expires_at')
            .gt('expires_at', bufferTime) // Expire time > Now + Buffer
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // PGRST116 is "The result contains 0 rows" which is fine (no token found)
            if (error.code !== 'PGRST116') {
                console.warn("[TokenManager] Failed to fetch stored token:", error.message);
            }
            return null;
        }

        if (data) {
            // console.log("[TokenManager] Reusing valid cached token");
            return data.token;
        }

        return null;
    } catch (e) {
        console.error("[TokenManager] Exception reading token:", e);
        return null;
    }
}

/**
 * Saves a new token to Supabase.
 * expires_in is in seconds (usually 86400).
 */
export async function saveToken(token: string, expiresIn: number): Promise<void> {
    try {
        const expiresAt = new Date(Date.now() + (expiresIn * 1000));

        const { error } = await supabase
            .from('kis_tokens')
            .insert({
                token: token,
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error("[TokenManager] Failed to save token:", error.message);
        } else {
            console.log("[TokenManager] New token cached until", expiresAt.toLocaleString());
        }
    } catch (e) {
        console.error("[TokenManager] Exception saving token:", e);
    }
}
