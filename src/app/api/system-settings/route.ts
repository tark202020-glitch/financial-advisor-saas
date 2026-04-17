import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const keysParam = searchParams.get('keys'); // 쉼표로 구분된 키 리스트 지원
        const supabase = await createClient();

        let query = supabase.from('system_settings').select('key_name, key_value');
        if (keysParam) {
            query = query.in('key_name', keysParam.split(',').map(k => k.trim()));
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        const adminEmails = ['tark202020@gmail.com', 'tark2020@naver.com'];
        if (authError || !user || !user.email || !adminEmails.includes(user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { key_name, key_value } = body;

        if (!key_name) {
            return NextResponse.json({ success: false, error: "key_name is required" }, { status: 400 });
        }

        const { error: upsertError } = await supabase
            .from('system_settings')
            .upsert({
                key_name,
                key_value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key_name'
            });

        if (upsertError) {
            return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Setting ${key_name} saved.` });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
