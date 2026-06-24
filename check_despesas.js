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
    .select('id, data, descricao, valor, tipo, forma_pagamento, conta_id, status, conciliado, banco_transacao_id, data_conciliacao')
    .eq('tenant_id', tenantId)
    .gte('data', '2026-01-01')
    .lte('data', '2026-01-31')
    .order('data');
    
  console.log('--- JAN 2026 DESPESAS DETAIL ---');
  lancamentos.filter(l => l.tipo === 'despesa').forEach(l => {
    console.log(`Desc: ${l.descricao}`);
    console.log(`  Valor: ${l.valor} | Status: ${l.status} | Conciliado: ${l.conciliado}`);
    console.log(`  Banco Transacao ID: ${l.banco_transacao_id} | Data Conciliacao: ${l.data_conciliacao}`);
  });
}

run();
