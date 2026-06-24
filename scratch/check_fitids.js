
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const fitids = ['392187f6-cea5-4a7f-884a-9a03d6819725', 'ef7fbbe9-7e2c-46c3-9849-c4f059e02daa'];
    console.log('Searching for FITIDs:', fitids);
    
    const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .in('banco_transacao_id', fitids);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} matches.`);
    data.forEach(l => {
        console.log(`- ID: ${l.id}, Date: ${l.data}, Value: ${l.valor}, Desc: ${l.descricao}, BankID: ${l.banco_transacao_id}, Tenant: ${l.tenant_id}, Status: ${l.status}`);
    });

    if (data.length === 0) {
        console.log('No matches found for these FITIDs. Checking for ANY launch with a bank ID in April...');
        const { data: aprilBank, error: error2 } = await supabase
            .from('lancamentos')
            .select('*')
            .not('banco_transacao_id', 'is', null)
            .gte('data', '2026-04-01')
            .lte('data', '2026-04-30');
        
        if (error2) console.error(error2);
        else {
            console.log(`Found ${aprilBank.length} total bank launches in April.`);
            aprilBank.forEach(l => {
                 console.log(`- ID: ${l.id}, Date: ${l.data}, Value: ${l.valor}, Desc: ${l.descricao}, BankID: ${l.banco_transacao_id}, Tenant: ${l.tenant_id}`);
            });
        }
    }
}

check();
