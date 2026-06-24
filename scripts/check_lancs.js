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
  const { data: contas } = await sb.from('contas_bancarias').select('id, nome').ilike('nome', '%cora%');
  const cora = contas[0];
  console.log(`Cora ID: ${cora.id}`);

  const { data: lancs } = await sb.from('lancamentos').select('data, conta_id').eq('conta_id', cora.id).limit(5);
  console.log('Lancamentos para Cora:', lancs);

  const { data: allLancs } = await sb.from('lancamentos').select('data, conta_id').limit(5);
  console.log('Sample lancamentos:', allLancs);
}

main();
