const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    process.env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
  }
});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  
  // Fetch all transactions to see their date ranges
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('id, data, tipo, valor, conta_id, status')
    .eq('tenant_id', tenantId);

  console.log(`Total transactions fetched: ${lancamentos?.length || 0}`);
  
  const years = {};
  lancamentos?.forEach(l => {
    const y = l.data ? l.data.split('-')[0] : 'no-date';
    years[y] = (years[y] || 0) + 1;
  });
  console.log('Transactions per year:', years);
}

run();
