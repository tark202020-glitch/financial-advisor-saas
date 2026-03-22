import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successful code exchange → redirect to intended page
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('[Auth Callback] Code exchange failed:', error.message)
    }

    // If no code or exchange failed, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
