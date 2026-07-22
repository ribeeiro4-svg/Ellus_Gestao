const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// if .env.local doesn't have supabase vars, try .env
const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : fs.readFileSync('.env', 'utf8');
let u, k;
for (let l of envFile.split('\n')) {
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) u = l.split('=')[1].trim().replace(/^"|"$/g, '');
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) k = l.split('=')[1].trim().replace(/^"|"$/g, '');
}

const sb = createClient(u, k);

async function run() {
  const ofxContent = fs.readFileSync('./docs/extrato/associacao-colaborativa-de-profissionais-liberais-comercio-e-setor-de-beleza_01062026_a_30062026_b9c77664.ofx', 'utf8');

  // Basic OFX parsing
  const stmttm = ofxContent.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g);
  const ofxTransactions = [];
  
  if (stmttm) {
    for (const t of stmttm) {
      const typeMatch = t.match(/<TRNTYPE>(.*)/);
      const dtpostedMatch = t.match(/<DTPOSTED>(.*)/);
      const trnamtMatch = t.match(/<TRNAMT>(.*)/);
      const memoMatch = t.match(/<MEMO>(.*)/);
      const fitidMatch = t.match(/<FITID>(.*)/);
      
      ofxTransactions.push({
        type: typeMatch ? typeMatch[1].trim() : '',
        date: dtpostedMatch ? dtpostedMatch[1].trim().substring(0, 8) : '', // YYYYMMDD
        amount: trnamtMatch ? parseFloat(trnamtMatch[1].trim()) : 0,
        memo: memoMatch ? memoMatch[1].trim().replace('</MEMO>', '') : '',
        id: fitidMatch ? fitidMatch[1].trim().replace('</FITID>', '') : ''
      });
    }
  }

  console.log(`Parsed ${ofxTransactions.length} transactions from OFX`);

  // Fetch conciliated DB records
  const { data: lancamentos, error } = await sb
    .from('lancamentos')
    .select('*')
    .gte('data', '2026-06-01')
    .lte('data', '2026-06-30')
    .eq('conciliado', true);
    
  if (error) {
    console.error('Error fetching lancamentos:', error);
    return;
  }
  
  console.log(`Fetched ${lancamentos.length} CONCILIATED lancamentos from DB in June 2026.`);
  
  // Normalize OFX for matching
  const ofxAvailable = [...ofxTransactions];
  
  const notFoundInOfx = [];
  const foundInOfx = [];
  
  for (const l of lancamentos) {
    // We try to match by exact value. The DB 'valor' might be positive. OFX 'amount' can be negative (expense) or positive (income).
    // Let's assume DB 'valor' is absolute or signed. We will match Math.abs(valor) or exact.
    // 'tipo' might indicate if it's income ('RECEITA') or expense ('DESPESA').
    
    // Convert OFX date string 'YYYYMMDD' to 'YYYY-MM-DD'
    let matchedIdx = -1;
    for (let i = 0; i < ofxAvailable.length; i++) {
      const ofx = ofxAvailable[i];
      const ofxDate = ofx.date.substring(0, 4) + '-' + ofx.date.substring(4, 6) + '-' + ofx.date.substring(6, 8);
      
      // Allow slight date variance (e.g. 1-2 days) because bank clearing vs DB posting
      const dateDiff = Math.abs(new Date(l.data).getTime() - new Date(ofxDate).getTime()) / (1000 * 3600 * 24);
      
      const dbValor = Number(l.valor);
      const dbTipo = l.tipo; // RECEITA ou DESPESA
      
      // Determine if the OFX amount matches the DB valor.
      // E.g. dbValor = 100, tipo='DESPESA' -> ofx amount = -100
      let matchValue = false;
      if (dbTipo === 'DESPESA' && Math.abs(ofx.amount - (-dbValor)) < 0.01) matchValue = true;
      else if (dbTipo === 'DESPESA' && Math.abs(ofx.amount - dbValor) < 0.01) matchValue = true; // In case DB stores negative for despesa
      else if (dbTipo === 'RECEITA' && Math.abs(ofx.amount - dbValor) < 0.01) matchValue = true;
      else if (Math.abs(Math.abs(ofx.amount) - Math.abs(dbValor)) < 0.01) matchValue = true; // Fallback to absolute match
      
      if (matchValue && dateDiff <= 3) {
        matchedIdx = i;
        break;
      }
    }
    
    if (matchedIdx !== -1) {
      foundInOfx.push({ db: l, ofx: ofxAvailable[matchedIdx] });
      // remove from available to avoid double counting
      ofxAvailable.splice(matchedIdx, 1);
    } else {
      notFoundInOfx.push(l);
    }
  }

  console.log(`\n================ RESULTADOS ================`);
  console.log(`Lancamentos Conciliados (DB): ${lancamentos.length}`);
  console.log(`Encontrados no OFX: ${foundInOfx.length}`);
  console.log(`NÃO encontrados no OFX (Divergências): ${notFoundInOfx.length}`);
  
  let outStr = `Lancamentos Conciliados (DB): ${lancamentos.length}\n`;
  outStr += `Encontrados no OFX: ${foundInOfx.length}\n`;
  outStr += `NÃO encontrados no OFX (Divergências): ${notFoundInOfx.length}\n\n`;
  
  // Analyze the 50 divergencies to see WHY they are conciliated
  if (notFoundInOfx.length > 0) {
    console.log(`\n================ ANÁLISE DAS DIVERGÊNCIAS ================`);
    
    // Check if they have a banco_transacao_id and if it's duplicated in the DB
    const divergedIds = notFoundInOfx.map(d => d.banco_transacao_id).filter(id => id);
    console.log(`Das ${notFoundInOfx.length} divergências, ${divergedIds.length} possuem banco_transacao_id preenchido.`);
    
    // Group all lancamentos by banco_transacao_id to find duplicates
    const idMap = {};
    let duplicatesFound = 0;
    
    for (const l of lancamentos) {
      if (l.banco_transacao_id) {
        if (!idMap[l.banco_transacao_id]) idMap[l.banco_transacao_id] = [];
        idMap[l.banco_transacao_id].push(l);
      }
    }
    
    console.log(`\nVerificando se houve conciliação múltipla para o mesmo ID de transação bancária...`);
    for (const key in idMap) {
      if (idMap[key].length > 1) {
        duplicatesFound++;
        // If one of the divergent records is in this list, log it
        const hasDivergent = idMap[key].some(l => notFoundInOfx.find(d => d.id === l.id));
        if (hasDivergent) {
          console.log(`⚠️  OFX ID ${key} foi conciliado com ${idMap[key].length} lançamentos:`);
          for (const l of idMap[key]) {
            console.log(`   -> Lancamento ID: ${l.id} | Valor: ${l.valor} | Tipo: ${l.tipo} | Data: ${l.data} | Desc: ${l.descricao}`);
          }
        }
      }
    }
    console.log(`Total de IDs do OFX vinculados a mais de 1 lançamento no DB: ${duplicatesFound}`);
    
    // Check if the system might have grouped multiple DB records into 1 OFX record without tracking properly
    console.log('\nExemplos de registros não encontrados no OFX e seus metadados de conciliação:');
    let foundByFitid = 0;
    for (let i = 0; i < notFoundInOfx.length; i++) {
      const d = notFoundInOfx[i];
      
      // Check if banco_transacao_id exists as FITID in OFX
      const matchedOfx = ofxTransactions.find(o => o.id === d.banco_transacao_id || o.id.includes(d.banco_transacao_id));
      if (i < 5) {
        console.log(`- DB ID: ${d.id} | banco_transacao_id: ${d.banco_transacao_id} | data_conciliacao: ${d.data_conciliacao}`);
        if (matchedOfx) {
          console.log(`  -> ENCONTRADO NO OFX PELO FITID! OFX Valor: ${matchedOfx.amount} | OFX Data: ${matchedOfx.date}`);
        } else {
          console.log(`  -> NÃO EXISTE NO OFX! (Nenhum FITID correspondente)`);
        }
      }
      if (matchedOfx) foundByFitid++;
    }
  } // End of if (notFoundInOfx.length > 0)

  // ================= SALDOS E TOTAIS =================
  console.log(`\n================ VERIFICAÇÃO DE SALDOS ================`);
  
  // 1. Calculate total movement in OFX
  let ofxTotalIncome = 0;
  let ofxTotalExpense = 0;
  for (const o of ofxTransactions) {
    if (o.amount > 0) ofxTotalIncome += o.amount;
    else ofxTotalExpense += o.amount;
  }
  const ofxNetMovement = ofxTotalIncome + ofxTotalExpense; // expense is negative
  
  // 2. Parse OFX Ledger Balance
  const balamtMatch = ofxContent.match(/<BALAMT>(.*)/);
  const ofxFinalBalance = balamtMatch ? parseFloat(balamtMatch[1].trim()) : null;
  
  // 3. Calculate total movement in DB (for June Conciliated)
  let dbTotalIncome = 0;
  let dbTotalExpense = 0;
  for (const l of lancamentos) {
    if (l.tipo.toUpperCase() === 'RECEITA') dbTotalIncome += Number(l.valor);
    else if (l.tipo.toUpperCase() === 'DESPESA') dbTotalExpense += Number(l.valor);
  }
  const dbNetMovement = dbTotalIncome - dbTotalExpense;
  
  console.log(`--- MOVIMENTAÇÃO DE JUNHO ---`);
  console.log(`[OFX] Entradas: R$ ${ofxTotalIncome.toFixed(2)} | Saídas: R$ ${Math.abs(ofxTotalExpense).toFixed(2)} | Saldo Líquido Mês: R$ ${ofxNetMovement.toFixed(2)}`);
  console.log(`[DB ] Entradas: R$ ${dbTotalIncome.toFixed(2)} | Saídas: R$ ${dbTotalExpense.toFixed(2)} | Saldo Líquido Mês: R$ ${dbNetMovement.toFixed(2)}`);
  
  console.log(`\n================ INVESTIGAÇÃO FINAL DAS 2 TRANSAÇÕES ================`);
  const missingFitids = [
    'f1e4d442-3f91-4884-a6d5-5782a19d284d', // Julia Lacerda
    '86e44274-ae76-4217-94f7-09d9246f77cf'  // Jeane dos Santos
  ];
  
  for (const fitid of missingFitids) {
    const { data: globalMatch, error: errGlobal } = await sb
      .from('lancamentos')
      .select('id, data, valor, descricao, banco_transacao_id')
      .ilike('banco_transacao_id', `%${fitid}%`);
      
    if (globalMatch && globalMatch.length > 0) {
      console.log(`✅ FITID ${fitid} FOI ENCONTRADO NO BANCO!`);
      console.log(`   -> Lançamento ID: ${globalMatch[0].id}`);
      console.log(`   -> Data no DB: ${globalMatch[0].data} (Isto explica por que não apareceu no filtro de Junho!)`);
      console.log(`   -> Valor: ${globalMatch[0].valor}`);
      console.log(`   -> Descrição: ${globalMatch[0].descricao}`);
    } else {
      console.log(`❌ FITID ${fitid} realmente NÃO existe em lugar nenhum do banco.`);
    }
  }
} // end run()

run();
