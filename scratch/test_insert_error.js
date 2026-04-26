
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
  console.log('Attempting dummy insert into nfse_financeiro_vinculo...');
  const { error } = await sb.from('nfse_financeiro_vinculo').insert({
    tenant_id: '971f92af-a72b-4bc4-a8e0-333d712ce6a7',
    nfe_id: '00000000-0000-0000-0000-000000000000',
    transacao_id: '00000000-0000-0000-0000-000000000000'
  });
  
  if (error) {
    console.log('Error Message:', error.message);
    console.log('Error Code:', error.code);
  } else {
    console.log('Insert successful? (Wait, dummy IDs shouldn\'t work if FK exists)');
  }
}

main();
