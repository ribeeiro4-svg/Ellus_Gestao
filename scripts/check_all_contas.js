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
  const { data: contas } = await sb.from('contas_bancarias').select('id, nome, tenant_id');
  console.log(JSON.stringify(contas, null, 2));

  // Check which one has lancamentos
  for (const c of contas) {
    const { count } = await sb.from('lancamentos').select('id', { count: 'exact', head: true }).eq('conta_id', c.id);
    console.log(`Conta ${c.nome} (ID: ${c.id}) has ${count} lancamentos`);
  }
}

main();
