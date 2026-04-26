
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const sql = `
    -- Adicionar colunas de vínculo financeiro
    ALTER TABLE nfe_entradas ADD COLUMN IF NOT EXISTS lancamento_financeiro_id UUID;
    ALTER TABLE nfse_entradas ADD COLUMN IF NOT EXISTS lancamento_financeiro_id UUID;
    
    -- Garantir colunas de status e data se não existirem
    ALTER TABLE nfe_entradas ADD COLUMN IF NOT EXISTS status_escrituracao TEXT DEFAULT 'pendente';
    ALTER TABLE nfe_entradas ADD COLUMN IF NOT EXISTS data_escrituracao TIMESTAMPTZ;
    ALTER TABLE nfe_entradas ADD COLUMN IF NOT EXISTS data_entrada DATE;
    
    -- Notificar o PostgREST para recarregar o cache do schema (CRUCIAL para o erro do cache)
    NOTIFY pgrst, 'reload schema';
  `;

  console.log('Running SQL fix via execute_sql RPC...');
  const { data, error } = await sb.rpc('execute_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error executing SQL:', error);
    // Try without sql_query key if it fails (sometimes it is just 'sql')
    const { error: error2 } = await sb.rpc('execute_sql', { sql });
    if (error2) console.error('Error executing SQL (attempt 2):', error2);
    else console.log('SQL Fix applied successfully (attempt 2)!');
  } else {
    console.log('SQL Fix applied successfully!');
  }
}

main();
