
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
  console.log('Testing xml_url column in nfe_entradas...');
  const { data, error } = await sb.from('nfe_entradas').select('xml_url').limit(1);
  if (error) {
    console.log('Column xml_url NOT found or other error:', error.message);
  } else {
    console.log('Column xml_url EXISTS!');
  }
}

main();
