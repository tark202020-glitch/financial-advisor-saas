import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
        .from('study_boards')
        .select('id, title, topic, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
        
    console.log("Error:", error);
    console.log("Data length:", data?.length);
    console.log("Data:", data);
}

testQuery();
