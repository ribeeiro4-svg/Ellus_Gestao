
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Searching for Angela Maria launches in April 2026...');
    const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .ilike('descricao', '%ANGELA MARIA%')
        .gte('data', '2026-04-01')
        .lte('data', '2026-04-30');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} launches for Angela Maria in April.`);
    data.forEach(l => {
        console.log(`- ID: ${l.id}, Date: ${l.data}, Value: ${l.valor}, Desc: ${l.descricao}, BankID: ${l.banco_transacao_id}, Status: ${l.status}, Conciliado: ${l.conciliado}`);
    });
}

check();
