'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

type RegisterState = {
    error: string | null;
    success: boolean;
    email?: string;
};

export async function register(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || headersList.get('x-forwarded-host') || ''

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const nickname = formData.get('nickname') as string

    if (!email || !password || !nickname) {
        return { error: '모든 필드를 입력해주세요.', success: false }
    }

    if (password.length < 6) {
        return { error: '비밀번호는 6자 이상이어야 합니다.', success: false }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: nickname,
            },
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error('[Register Action] Error:', error.message)
        return { error: error.message, success: false }
    }

    // Supabase returns a user with identities=[] if email already exists (and email confirmations are on)
    if (data?.user?.identities?.length === 0) {
        return { error: '이미 등록된 이메일 주소입니다.', success: false }
    }

    return { error: null, success: true, email }
}
