'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    const isAutoLogin = formData.get('autoLogin') === 'on'
    const cookieStore = await cookies()
    cookieStore.set('sb-auto-login', isAutoLogin ? 'true' : 'false', {
        path: '/',
        maxAge: 31536000, // 1년
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    // 로그아웃 시 자동 로그인 쿠키 파기
    const cookieStore = await cookies()
    cookieStore.delete('sb-auto-login')

    revalidatePath('/', 'layout')
    redirect('/login')
}
