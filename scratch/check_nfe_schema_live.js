
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
  console.log('Fetching one record from nfe_entradas to see available columns...');
  // Since we don't have a session, we might not see anything due to RLS
  // But we can try to find a public record if any, or just check the error of a known non-existent record
  const { data, error } = await sb.from('nfe_entradas').select('*').limit(1);
  
  if (error) {
    console.error('Fetch Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Record found! Columns:', Object.keys(data[0]).sort());
  } else {
    console.log('No records visible in nfe_entradas with ANON_KEY.');
  }
}

main();
