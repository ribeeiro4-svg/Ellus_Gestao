const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    process.env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
  }
});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('plano_contas')
    .select('id, codigo, descricao, tipo, nivel')
    .eq('tenant_id', '971f92af-a72b-4bc4-a8e0-333d712ce6a7')
    .order('codigo');

  if (error) {
    console.error(error);
  } else {
    data.forEach(d => console.log(`${d.codigo} - ${d.descricao} (${d.tipo}, Nível ${d.nivel})`));
  }
}

run();
