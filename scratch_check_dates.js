const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: associados, error } = await sb.from('associados').select('id, nome, email, data_assinatura').not('data_assinatura', 'is', null);
    if (error) {
        console.error('Error fetching associados', error);
        return;
    }
    console.log(`Found ${associados.length} associados with data_assinatura.`);
}
run();
