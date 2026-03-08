import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const topic = searchParams.get('topic') || 'msci';
        const supabase = await createClient();

        // 관리자인지 확인 (클라이언트에서도 체크하지만 API에서도 확인하면 더 안전)
        // 일단 읽기는 public이므로 누구나 가능하지만, API 단에서는 추가 검증할 수 있음
        const { data: boards, error } = await supabase
            .from('study_boards')
            .select('id, title, content, created_at, updated_at')
            .eq('topic', topic)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("API /study-boards error fetching:", error);
            return NextResponse.json({ error: "Failed to fetch study boards" }, { status: 500 });
        }

        // Return similar structure to what frontend expects, or adapt frontend
        // Currently frontend expects fileList (strings). Let's return the full objects here
        // and adjust the frontend.
        return NextResponse.json({ boards: boards || [] });

    } catch (error: any) {
        console.error("API /study-boards error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();

        // Authorization check: Must be admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user || user.email !== 'tark202020@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, content } = body;

        if (!id || typeof content !== 'string') {
            return NextResponse.json({ error: "Invalid path or content" }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from('study_boards')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error("API /study-boards update error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "File updated successfully" });

    } catch (error: any) {
        console.error("API /study-boards error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
