
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
  console.log('Checking conciliacao_logs table...');
  const { data, count, error } = await sb.from('conciliacao_logs').select('*', { count: 'exact' });
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Total logs in DB:', count);
    if (data && data.length > 0) {
      console.log('Last log:', JSON.stringify(data[data.length - 1], null, 2));
    }
  }
}

main();
