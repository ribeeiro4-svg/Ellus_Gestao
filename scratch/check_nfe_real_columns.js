
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
  console.log('Fetching NFe 463625 to check columns...');
  const { data, error } = await sb.from('nfe_entradas').select('*').eq('numero_nf', '463625').maybeSingle();
  if (error) {
    console.error('Error:', error);
  } else if (data) {
    console.log('Columns found:', Object.keys(data).sort());
    console.log('financeiro_lancamento_id value:', data.financeiro_lancamento_id);
    console.log('lancamento_financeiro_id value:', data.lancamento_financeiro_id);
  } else {
    console.log('Record not found.');
  }
}

main();
