import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    console.log(`[MW] ${new Date().toISOString()} Processing: ${request.nextUrl.pathname}`);
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    const isAutoLogin = request.cookies.get('sb-auto-login')?.value === 'true';

                    cookiesToSet.forEach(({ name, value, options }) => {
                        let finalOptions = { ...options };
                        if (!isAutoLogin) {
                            delete finalOptions.maxAge;
                            delete finalOptions.expires;
                        }
                        request.cookies.set(name, value)
                    })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        let finalOptions = { ...options };
                        if (!isAutoLogin) {
                            delete finalOptions.maxAge;
                            delete finalOptions.expires;
                        }
                        supabaseResponse.cookies.set(name, value, finalOptions)
                    })
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/register') &&
        !request.nextUrl.pathname.startsWith('/forgot-password') &&
        !request.nextUrl.pathname.startsWith('/update-password') &&
        !request.nextUrl.pathname.startsWith('/push/') &&
        !request.nextUrl.pathname.startsWith('/api/') &&
        request.nextUrl.pathname !== '/'
    ) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
