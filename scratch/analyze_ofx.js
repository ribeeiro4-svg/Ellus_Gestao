const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function analyze() {
  // 1. Get Accounts
  const { data: accounts } = await sb.from('contas_bancarias').select('id, nome, banco');
  console.log('CONTAS:', accounts);

  const cora = accounts.find(a => a.nome.toLowerCase().includes('cora') || a.banco?.toLowerCase().includes('cora'));
  if (!cora) {
    console.error('Conta Cora não encontrada');
    return;
  }
  console.log('ID Cora:', cora.id);

  // 2. Read OFX
  const ofxPath = path.join('c:', 'GRUPO ÁUREA', 'DEV', 'InovacontACPROBEC', 'docs', 'associacao-colaborativa-de-profissionais-liberais-comercio-e-setor-de-beleza_01042026_a_30042026_be64fa9a.ofx');
  const ofxContent = fs.readFileSync(ofxPath, 'utf8');

  // Simple OFX Parser for STMTTRN
  const transactions = [];
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  while ((match = trnRegex.exec(ofxContent)) !== null) {
    const trn = match[1];
    const type = trn.match(/<TRNTYPE>(.*)/)?.[1];
    const date = trn.match(/<DTPOSTED>(\d{8})/)?.[1]; // YYYYMMDD
    const amount = parseFloat(trn.match(/<TRNAMT>([^<\s]+)/)?.[1]?.replace(',', '.'));
    const memo = trn.match(/<MEMO>([^<\s]+)/)?.[1] || trn.match(/<NAME>([^<\s]+)/)?.[1];
    const fitid = trn.match(/<FITID>([^<\s]+)/)?.[1];

    if (date && !isNaN(amount)) {
      const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      transactions.push({ date: formattedDate, amount, memo, fitid });
    }
  }
  console.log(`OFX: ${transactions.length} transações encontradas.`);

  // 3. Get DB Transactions
  const { data: dbItems } = await sb.from('lancamentos')
    .select('id, data, valor, descricao, tipo, categoria')
    .eq('conta_id', cora.id)
    .gte('data', '2026-04-01')
    .lte('data', '2026-04-30');

  console.log(`DB: ${dbItems?.length || 0} lançamentos encontrados em Abril.`);

  // 4. Comparison logic
  const ofxTotal = transactions.reduce((acc, t) => acc + t.amount, 0);
  const dbTotal = dbItems.reduce((acc, t) => acc + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);

  console.log('--- RESUMO ---');
  console.log('Total OFX (Net):', ofxTotal.toFixed(2));
  console.log('Total DB (Net):', dbTotal.toFixed(2));
  console.log('Diferença:', (ofxTotal - dbTotal).toFixed(2));

  // Find missing in DB
  const missingInDb = [];
  transactions.forEach(t => {
    const match = dbItems.find(db => 
      db.data === t.date && 
      Math.abs(Math.abs(db.valor) - Math.abs(t.amount)) < 0.01 &&
      (t.amount > 0 ? db.tipo === 'receita' : db.tipo === 'despesa')
    );
    if (!match) missingInDb.push(t);
  });

  // Find duplicates or orphans in DB
  const orphansInDb = [];
  dbItems.forEach(db => {
    const dbVal = db.tipo === 'receita' ? Number(db.valor) : -Number(db.valor);
    const match = transactions.find(t => 
      t.date === db.data && 
      Math.abs(t.amount - dbVal) < 0.01
    );
    if (!match) orphansInDb.push(db);
  });

  console.log('--- DETALHES ---');
  console.log('Faltando no Sistema (Total:', missingInDb.length, '):');
  missingInDb.slice(0, 10).forEach(m => console.log(`  - ${m.date} | ${m.amount.toFixed(2)} | ${m.memo}`));
  
  console.log('Lançamentos no Sistema não encontrados no Extrato (Total:', orphansInDb.length, '):');
  orphansInDb.slice(0, 10).forEach(o => console.log(`  - ${o.data} | ${o.valor} | ${o.descricao} (${o.tipo})`));

  fs.writeFileSync('comparison_result.json', JSON.stringify({
    summary: { ofxTotal, dbTotal, diff: ofxTotal - dbTotal },
    missingInDb,
    orphansInDb
  }, null, 2));
}

analyze();
