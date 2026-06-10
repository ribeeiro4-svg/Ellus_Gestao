const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8').split('\n');
let supabaseUrl, supabaseKey;
for (let line of envContent) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/^"|"$/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/^"|"$/g, '');
}
const admin = createClient(supabaseUrl, supabaseKey);

// The error showed: (id, associado_id, col3, col4, col5, col6, col7, status='ativo', col9, created_at, updated_at, tenant_id)
// Let's try common column names one by one
async function probe() {
  const candidates = [
    { valor_total: 100, num_parcelas: 2, valor_parcela: 50, data_vencimento: '2026-07-01', observacao: 'teste', status: 'ativo' },
  ];
  
  for (const payload of candidates) {
    const { data, error } = await admin
      .from('cobranca_acordos')
      .insert({ associado_id: '00000000-0000-0000-0000-000000000001', ...payload })
      .select();
    
    if (!error && data) {
      console.log('SUCCESS! Record:', JSON.stringify(data[0], null, 2));
      await admin.from('cobranca_acordos').delete().eq('id', data[0].id);
    } else {
      console.log('Failed:', error?.message);
    }
  }
}
probe();
