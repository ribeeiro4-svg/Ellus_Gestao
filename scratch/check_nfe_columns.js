
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
  console.log('Checking nfe_entradas columns...');
  const { data, error } = await sb.rpc('execute_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'nfe_entradas'" });
  if (error) console.error(error);
  else console.log('Columns:', data.map(c => c.column_name).join(', '));
}

main();
