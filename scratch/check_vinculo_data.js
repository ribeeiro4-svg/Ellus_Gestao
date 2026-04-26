
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
  console.log('Checking nfse_financeiro_vinculo entries...');
  const { data, error } = await sb.from('nfse_financeiro_vinculo').select('*, nfe:nfe_id(numero_nf)').limit(5);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Entries:', JSON.stringify(data, null, 2));
  }
}

main();
