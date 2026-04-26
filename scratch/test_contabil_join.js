
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
  console.log('Checking lancamentos_contabeis structure...');
  const { data, error } = await sb.from('lancamentos_contabeis').select('*, nfse:origem_id(xml_url)').limit(1);
  if (error) console.log('Join with nfse failed:', error.message);
  else console.log('Join with nfse worked!');

  const { data: data2, error: error2 } = await sb.from('lancamentos_contabeis').select('*, nfe:origem_id(chave_acesso)').limit(1);
  if (error2) console.log('Join with nfe failed:', error2.message);
  else console.log('Join with nfe worked!');
}

main();
