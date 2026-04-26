
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
  const sql = "SELECT column_name FROM information_schema.columns WHERE table_name = 'nfse_financeiro_vinculo'";
  const { data, error } = await sb.rpc('execute_sql', { sql });
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Columns in nfse_financeiro_vinculo:', data.map(c => c.column_name).join(', '));
  }
}

main();
