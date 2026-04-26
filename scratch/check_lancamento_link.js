
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
  console.log('Fetching one lancamento with its vínculos...');
  // We search for the specific lancamento that was linked in the screenshot
  const { data, error } = await sb.from('lancamentos')
    .select('id, descricao, nfse_vinculo:nfse_financeiro_vinculo(*, nfe:nfe_id(numero_nf))')
    .ilike('descricao', '%MAGALUPAY%')
    .limit(1);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Result:', JSON.stringify(data, null, 2));
  }
}

main();
