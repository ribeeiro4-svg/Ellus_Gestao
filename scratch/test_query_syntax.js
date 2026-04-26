
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
  console.log('Testing useFinanceiro query...');
  // We don't have a session, so this might fail RLS, but we want to check if the SYNTAX is valid
  // If the syntax is invalid, it returns a 400 error regardless of RLS
  const { data, error } = await sb.from('lancamentos')
    .select('*, nfse_vinculo:nfse_financeiro_vinculo(*, nfse:nfse_id(numero_nfse, xml_url), nfe:nfe_id(numero_nf, xml_url))')
    .limit(1);
  
  if (error) {
    console.log('Query Error:', error);
  } else {
    console.log('Query Success (Syntax OK):', data);
  }
}

main();
