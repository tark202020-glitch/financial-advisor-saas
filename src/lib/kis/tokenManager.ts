import { createClient } from '@supabase/supabase-js';

// Create a local instance for backend operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface KisTokenRecord {
    id: number;
    token: string;
    expires_at: string;
    created_at: string;
}

interface StoredTokenResult {
    token: string;
    isExpired: boolean;
    expiresAt: Date;
}

/**
 * Supabase에서 토큰을 조회합니다.
 * 
 * 핵심 변경: 만료된 토큰도 반환합니다 (isExpired 플래그와 함께).
 * 만료된 토큰이라도 KIS API에서는 약간의 유예가 있을 수 있고,
 * 갱신 대기 중에도 기존 토큰으로 시도하는 것이 에러보다 낫습니다.
 */
export async function getStoredToken(): Promise<StoredTokenResult | null> {
    try {
        // 가장 최근 토큰을 가져옴 (만료 여부 무관)
        const { data, error } = await supabase
            .from('kis_tokens')
            .select('token, expires_at, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.warn("[TokenManager] Failed to fetch stored token:", error.message);
            }
            return null;
        }

        if (data) {
            const expiresAt = new Date(data.expires_at);
            const now = new Date();
            const isExpired = expiresAt <= now;

            return {
                token: data.token,
                isExpired,
                expiresAt,
            };
        }

        return null;
    } catch (e) {
        console.error("[TokenManager] Exception reading token:", e);
        return null;
    }
}

/**
 * 분산 잠금: 갱신이 필요한지 + 갱신 가능한지 확인합니다.
 * 
 * 다른 인스턴스가 최근 5분 내에 이미 토큰을 갱신했다면 재갱신을 차단합니다.
 * 이렇게 하면 Vercel의 다중 인스턴스가 동시에 토큰을 발급받는 것을 방지합니다.
 * 
 * @returns true = 갱신 진행 가능 / false = 다른 인스턴스가 최근 갱신함
 */
export async function shouldRefreshToken(): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('kis_tokens')
            .select('created_at, expires_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            // 토큰 자체가 없으면 갱신 필요 (만료 토큰이 삭제된 경우 포함)
            return true;
        }

        const createdAt = new Date(data.created_at);
        const expiresAt = new Date(data.expires_at);
        const now = new Date();

        // 아직 유효한 토큰이면 갱신 불필요
        if (expiresAt > now) {
            return false;
        }

        // 만료됐지만, 최근 2분 내에 생성/갱신된 토큰이면 다른 인스턴스가 방금 갱신 시도한 것
        // → 재시도 방지 (쿨다운) — 5분→2분으로 단축
        const cooldownMs = 2 * 60 * 1000; // 2분
        if (now.getTime() - createdAt.getTime() < cooldownMs) {
            console.log("[TokenManager] Token refresh cooldown active (created", 
                Math.round((now.getTime() - createdAt.getTime()) / 1000), "sec ago)");
            return false;
        }

        return true;
    } catch (e) {
        console.error("[TokenManager] Exception in shouldRefreshToken:", e);
        // 에러 시 안전하게 갱신 허용 (한 번은 시도)
        return true;
    }
}

/**
 * 분산 잠금 획득: 토큰 행의 created_at을 현재 시간으로 업데이트합니다.
 * 
 * 이 업데이트 자체가 "잠금"역할을 합니다.
 * 여러 인스턴스가 동시에 호출해도, 하나만 실제 KIS API를 호출하고
 * 나머지는 shouldRefreshToken()에서 쿨다운에 걸립니다.
 */
export async function markRefreshAttempt(): Promise<void> {
    try {
        // 기존 토큰의 created_at을 현재로 업데이트 (쿨다운 시작)
        await supabase
            .from('kis_tokens')
            .update({ created_at: new Date().toISOString() })
            .neq('id', 0);
    } catch (e) {
        console.warn("[TokenManager] Failed to mark refresh attempt:", e);
    }
}

/**
 * Saves a new token to Supabase.
 * expires_in is in seconds (usually 86400).
 * 기존 토큰을 모두 삭제 후 새로 저장하여 누적 방지.
 */
export async function saveToken(token: string, expiresIn: number): Promise<void> {
    try {
        const expiresAt = new Date(Date.now() + (expiresIn * 1000));

        // 기존 토큰 삭제 후 새로 저장 (누적 방지)
        await supabase.from('kis_tokens').delete().neq('id', 0);

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

/**
 * Clears all stored tokens from Supabase.
 * API 키 교체 시, 또는 토큰 만료 에러 발생 시 호출.
 */
export async function clearStoredTokens(): Promise<void> {
    try {
        const { error } = await supabase
            .from('kis_tokens')
            .delete()
            .neq('id', 0);
        if (error) {
            console.error("[TokenManager] Failed to clear tokens:", error.message);
        } else {
            console.log("[TokenManager] All cached tokens cleared");
        }
    } catch (e) {
        console.error("[TokenManager] Exception clearing tokens:", e);
    }
}
