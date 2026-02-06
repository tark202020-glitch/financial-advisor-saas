
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jkeisufqjemsnqamiqlv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZWlzdWZxamVtc25xYW1pcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDkxMzAsImV4cCI6MjA4MTE4NTEzMH0.zmlqqSlA6B05wrdWRrxdF0qeCgHf7hB_J6Nam8H1Auo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Analyzing Supabase Tables...");

    const candidates = ['assets', 'portfolio', 'stocks', 'trades', 'trade_logs', 'transactions', 'users'];

    for (const table of candidates) {
        // Try to fetch one row
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`\n✅ FOUND Table: '${table}'`);
            if (data && data.length > 0) {
                console.log('   Columns:', Object.keys(data[0]).join(', '));
            } else {
                console.log('   (Empty Table, columns unknown via select)');
                // If empty, we can try to insert a dummy to get schema error, 
                // but let's hope there's data or user gives schema.
            }
        } else {
            // console.log(`   (Not '${table}': ${error.message})`);
        }
    }
}

inspect();
