
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
  const { error: err1 } = await sb.from('nfe_entradas').select('financeiro_lancamento_id').limit(1);
  console.log('financeiro_lancamento_id:', err1 ? 'NO (' + err1.message + ')' : 'YES');
  
  const { error: err2 } = await sb.from('nfe_entradas').select('lancamento_financeiro_id').limit(1);
  console.log('lancamento_financeiro_id:', err2 ? 'NO (' + err2.message + ')' : 'YES');
}

main();
