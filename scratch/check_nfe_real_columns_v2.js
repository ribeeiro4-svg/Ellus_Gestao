
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
  console.log('Fetching ANY NFe to check columns...');
  const { data, error } = await sb.from('nfe_entradas').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('Error:', error);
  } else if (data) {
    console.log('Columns found:', Object.keys(data).sort());
  } else {
    console.log('No records found in nfe_entradas.');
  }
}

main();
