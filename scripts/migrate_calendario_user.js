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
  console.log('Adicionando colunas de usuário e período na tabela conciliacao_calendario_dias...');
  
  // Como as migrations estão sendo feitas via script para evitar conflitos com Prisma
  const query = `
    ALTER TABLE conciliacao_calendario_dias
    ADD COLUMN IF NOT EXISTS conciliado_por_nome VARCHAR,
    ADD COLUMN IF NOT EXISTS conciliado_por_email VARCHAR,
    ADD COLUMN IF NOT EXISTS periodo_conciliado VARCHAR;
  `;
  
  const { error } = await sb.rpc('execute_sql', { sql: query });
  
  if (error) {
    console.error('Erro via RPC, tentando REST / psql_fallback:', error);
    // Se o RPC não existir, o Supabase não permite executar DDL facilmente pela API JS. 
    // Em caso de erro, criaremos uma function via supabase cli ou alertaremos.
  } else {
    console.log('Colunas adicionadas com sucesso.');
  }
}

main();
