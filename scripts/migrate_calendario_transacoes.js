const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env.local', 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '');
      }
    }
  } catch (e) {}
  return null;
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const sb = createClient(url, key);

async function main() {
  console.log('Adicionando coluna teve_transacoes na tabela conciliacao_calendario_dias...');
  
  const query = `
    ALTER TABLE conciliacao_calendario_dias
    ADD COLUMN IF NOT EXISTS teve_transacoes BOOLEAN DEFAULT TRUE;
  `;
  
  const { error } = await sb.rpc('execute_sql', { sql: query });
  
  if (error) {
    console.error('Erro na migração:', error);
  } else {
    console.log('Coluna teve_transacoes adicionada com sucesso.');
  }
}

main();
