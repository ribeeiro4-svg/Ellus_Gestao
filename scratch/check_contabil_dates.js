
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
  console.log('Checking lancamentos_contabeis dates...');
  const { data, error } = await sb.from('lancamentos_contabeis')
    .select('data_competencia')
    .order('data_competencia', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Recent dates:', data.map(l => l.data_competencia).join(', '));
    
    // Count by month for 2026
    const { count: fev26 } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true })
      .gte('data_competencia', '2026-02-01').lte('data_competencia', '2026-02-28');
    const { count: abr26 } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true })
      .gte('data_competencia', '2026-04-01').lte('data_competencia', '2026-04-30');
    
    console.log('Fev 2026 count:', fev26);
    console.log('Abr 2026 count:', abr26);
  }
}

main();
