import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        const isAutoLogin = cookieStore.get('sb-auto-login')?.value === 'true';
                        cookiesToSet.forEach(({ name, value, options }) => {
                            let finalOptions = { ...options };
                            if (!isAutoLogin) {
                                delete finalOptions.maxAge;
                                delete finalOptions.expires;
                            }
                            cookieStore.set(name, value, finalOptions)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
