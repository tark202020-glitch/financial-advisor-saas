require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data, error } = await supabase.from('study_boards').select('id, title, topic').limit(3).order('created_at', { ascending: false });
    console.log(data);
    console.log(error);
}
test();
