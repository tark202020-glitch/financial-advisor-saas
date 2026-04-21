require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data: changes, error: changeError } = await supabase
        .from('etf_changes')
        .select('*')
        .limit(5);
    console.log("CHANGES:");
    console.log(changes, changeError);

    const { data: holdings, error: holdError } = await supabase
        .from('etf_holdings')
        .select('snapshot_date, etf_symbol')
        .order('snapshot_date', { ascending: false })
        .limit(20);
    console.log("HOLDINGS:");
    console.log(holdings, holdError);
}
run();
