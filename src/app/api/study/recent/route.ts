import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        // Initialize Supabase client inside the handler
        const supabase = createClient(supabaseUrl, supabaseKey);

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
