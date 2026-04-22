require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  console.log('Adding zapsign_sync_at column...');
  
  // Try to use rpc if available, or just use raw SQL endpoint if it exists
  const { data, error } = await sb.rpc('exec_sql', {
    sql_string: `
      ALTER TABLE associados ADD COLUMN IF NOT EXISTS zapsign_sync_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE associados ADD COLUMN IF NOT EXISTS termo_status TEXT;
      ALTER TABLE associados ADD COLUMN IF NOT EXISTS plano_saude TEXT;
      NOTIFY pgrst, 'reload schema';
    `
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Schema reloaded.');
  }
})();
