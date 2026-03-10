import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch the 3 most recent study documents
        const { data, error } = await supabase
            .from('study_boards')
            .select('id, title, topic, created_at')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error('Study API Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            documents: data || [],
        });
    } catch (err: any) {
        console.error('Unexpected error fetching recent studies:', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
