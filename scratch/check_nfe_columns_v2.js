
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const sbAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  console.log('Searching for NFe 463625...');
  const { data: rec, error } = await sbAdmin.from('nfe_entradas').select('*').eq('numero_nf', '463625').maybeSingle();
  if (error) {
    console.error('Error:', error);
  } else if (rec) {
    console.log('Record found!');
    console.log('Keys:', Object.keys(rec).sort().join(', '));
    console.log('Values of potential link columns:');
    console.log('financeiro_lancamento_id:', rec.financeiro_lancamento_id);
    console.log('lancamento_financeiro_id:', rec.lancamento_financeiro_id);
    console.log('financeiro_id:', rec.financeiro_id);
  } else {
    console.log('NFe 463625 not found.');
  }
}

main();
