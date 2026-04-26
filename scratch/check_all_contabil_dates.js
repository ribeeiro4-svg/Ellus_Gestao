
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
  console.log('Checking all lancamentos_contabeis dates...');
  const { data, error } = await sb.from('lancamentos_contabeis')
    .select('data_competencia')
    .limit(10);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Sample dates:', data.map(l => l.data_competencia).join(', '));
  }
}

main();
