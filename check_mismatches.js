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
  
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('id, data, descricao, valor, tipo, forma_pagamento, conta_id, status')
    .eq('tenant_id', tenantId)
    .gte('data', '2026-01-01')
    .lte('data', '2026-01-31')
    .order('data');

  // Accounts
  const { data: contas } = await supabase.from('contas_bancarias').select('*').eq('tenant_id', tenantId);
  const cora = contas.find(c => c.nome.includes('CORA') || c.nome.includes('Cora'));
  const caixa = contas.find(c => c.nome.includes('CAIXA') || c.nome.includes('Caixa'));
  
  console.log(`Cora ID: ${cora?.id}`);
  console.log(`Caixa ID: ${caixa?.id}`);

  console.log('\n--- MISMATCHES (Jan 2026) ---');
  lancamentos.forEach(l => {
    // If Cash, should be Caixa. If PIX/Boleto/Transfer/etc, should be Cora
    const isCashPayment = l.forma_pagamento === 'Dinheiro';
    const isCaixaAccount = l.conta_id === caixa?.id;
    
    if (isCashPayment && !isCaixaAccount) {
      console.log(`[MISMATCH: Cash payment in non-Caixa account] Desc: ${l.descricao} | Valor: ${l.valor} | Forma: ${l.forma_pagamento} | Account ID: ${l.conta_id} (${contas.find(c => c.id === l.conta_id)?.nome})`);
    } else if (!isCashPayment && isCaixaAccount) {
      console.log(`[MISMATCH: Non-cash payment in Caixa account] Desc: ${l.descricao} | Valor: ${l.valor} | Forma: ${l.forma_pagamento} | Account ID: ${l.conta_id} (${contas.find(c => c.id === l.conta_id)?.nome})`);
    }
  });
}

run();
