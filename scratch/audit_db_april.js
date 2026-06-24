const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditApril() {
  console.log('--- DATABASE AUDIT (APRIL 2026) ---');
  
  const { data: lancamentos, error } = await supabase
    .from('lancamentos')
    .select('*')
    .gte('data', '2026-04-01')
    .lte('data', '2026-04-30')
    .order('data', { ascending: true });

  if (error) {
    console.error('Error fetching lancamentos:', error);
    return;
  }

  let totalInc = 0;
  let totalExp = 0;
  let countInc = 0;
  let countExp = 0;
  
  const fitids = new Set();
  const duplicates = [];

  lancamentos.forEach(l => {
    if (l.tipo === 'receita') {
      totalInc += l.valor;
      countInc++;
    } else {
      totalExp += l.valor;
      countExp++;
    }

    if (l.banco_transacao_id) {
      if (fitids.has(l.banco_transacao_id)) {
        duplicates.push(l);
      }
      fitids.add(l.banco_transacao_id);
    }
  });

  console.log(`Total Records: ${lancamentos.length}`);
  console.log(`Income: ${countInc} | Total: R$ ${totalInc.toFixed(2)}`);
  console.log(`Expense: ${countExp} | Total: R$ ${totalExp.toFixed(2)}`);
  console.log(`Net Change: R$ ${(totalInc - totalExp).toFixed(2)}`);
  console.log(`Duplicates (same fitid): ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log('Duplicate examples:', duplicates.slice(0, 3).map(d => ({ id: d.id, desc: d.descricao, fitid: d.banco_transacao_id })));
  }

  // Check for "Taxa" in description and if it's included in value
  const withTaxInDesc = lancamentos.filter(l => (l.descricao || '').includes('(Taxa: R$'));
  console.log(`Records with Tax in description: ${withTaxInDesc.length}`);
}

auditApril();
