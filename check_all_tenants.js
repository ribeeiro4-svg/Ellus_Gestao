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
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: tenants, error } = await supabase.from('tenants').select('*');
  if (error) {
    console.error('Error fetching tenants:', error);
    return;
  }
  for (const t of tenants) {
    const { count, error: errC } = await supabase
      .from('lancamentos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', t.id);
    console.log(`Tenant: ${t.nome} | ID: ${t.id} | Lancamentos Count: ${count}`);
  }
}

run();
