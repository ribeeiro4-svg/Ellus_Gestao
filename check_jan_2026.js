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

function getMesIdx(dataStr) {
  if (!dataStr) return -1;
  const s = String(dataStr);
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length >= 2) return parseInt(parts[1]) - 1;
  }
  if (s.includes('-')) {
    const parts = s.split('T')[0].split('-');
    if (parts.length >= 2) {
      if (parts[0].length === 4) return parseInt(parts[1]) - 1;
      return parseInt(parts[1]) - 1;
    }
  }
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? -1 : d.getUTCMonth();
}

function getAnoIdx(dataStr) {
  if (!dataStr) return -1;
  const s = String(dataStr);
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length >= 3) return parseInt(parts[2]);
  }
  if (s.includes('-')) {
    const parts = s.split('T')[0].split('-');
    if (parts.length >= 1) {
      if (parts[0].length === 4) return parseInt(parts[0]);
      if (parts.length >= 3) return parseInt(parts[2]);
    }
  }
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? -1 : d.getUTCFullYear();
}

function getRealizedInfo(l) {
  const statusLower = (l.status || '').toLowerCase();
  const isPaid = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso', 'parcial'].includes(statusLower) || !!l.data_conciliacao;
  const dateToUse = (isPaid && l.data_conciliacao) ? l.data_conciliacao : l.data;
  if (!dateToUse) return { isPaid: false, m: -1, y: -1 };
  return { isPaid, m: getMesIdx(dateToUse), y: getAnoIdx(dateToUse) };
}

async function run() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  const selectedMes = 0; // Janeiro
  const selectedAno = 2026;
  
  // Accounts
  const { data: contas } = await supabase.from('contas_bancarias').select('*').eq('tenant_id', tenantId);
  // Fechamentos
  const { data: fechamentos } = await supabase.from('fechamentos_periodo').select('*, snapshot:fechamentos_contas(*)').eq('tenant_id', tenantId);
  
  // Fetch only 2026 transactions
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('data', '2026-01-01')
    .lte('data', '2026-12-31')
    .order('data');

  console.log(`Fechamentos found: ${fechamentos?.length || 0}`);
  fechamentos?.forEach(f => {
    console.log(`Fechamento ${f.mes}/${f.ano} status=${f.status}`);
  });

  contas.forEach(conta => {
    console.log(`\n================ ACCOUNT: ${conta.nome} (${conta.id}) ================`);
    
    // 1. Calculate saldoAnterior
    const fechamentosOrdenados = [...(fechamentos || [])]
      .filter(f => f.ano < selectedAno || (f.ano === selectedAno && f.mes < selectedMes))
      .sort((a, b) => b.ano - a.ano || b.mes - a.mes);
    
    const ultimoFechamento = fechamentosOrdenados[0];
    const snapshotAnterior = ultimoFechamento?.snapshot?.find((s) => s.conta_id === conta.id);
    
    let baseBalance = snapshotAnterior ? snapshotAnterior.saldo_final_real : (conta.saldo_inicial || 0);
    console.log(`baseBalance = ${baseBalance} (from ${snapshotAnterior ? 'snapshot' : 'initial_balance'})`);
    
    const startM = ultimoFechamento ? ultimoFechamento.mes + 1 : -1;
    const startY = ultimoFechamento ? ultimoFechamento.ano : -1;

    let saldoAnterior = lancamentos.reduce((sum, l) => {
      if (l.conta_id !== conta.id) return sum;
      const st = getRealizedInfo(l);
      if (!st.isPaid) return sum;

      const dateToUse = l.data_conciliacao || l.data;
      const m = getMesIdx(dateToUse);
      const y = getAnoIdx(dateToUse);

      const isAfterLast = !ultimoFechamento || (y > startY || (y === startY && m >= startM));
      const isBeforeCurrent = y < selectedAno || (y === selectedAno && m < selectedMes);

      if (isAfterLast && isBeforeCurrent) {
        const v = Math.abs(Number(l.valor) || 0);
        const tipo = (l.tipo || '').toLowerCase();
        const cat = (l.categoria || '').toLowerCase();
        if (cat.includes('transferência interna')) return sum;

        const impact = v;
        if (tipo === 'receita') sum = sum + impact;
        else sum = sum - impact;
      }
      return sum;
    }, baseBalance);
    
    console.log(`Calculated Saldo Anterior: ${saldoAnterior}`);

    // 2. Month transactions
    let movimEntrada = 0;
    let movimSaida = 0;
    let pInc = 0;
    let pExp = 0;

    const transacoesConta = lancamentos.filter(l => l.conta_id === conta.id);
    transacoesConta.forEach(l => {
      const st = getRealizedInfo(l);
      if (!st.isPaid) return;

      const dateToUse = l.data_conciliacao || l.data;
      const m = getMesIdx(dateToUse);
      const y = getAnoIdx(dateToUse);

      if (m === selectedMes && y === selectedAno) {
        const v = Math.abs(Number(l.valor) || 0);
        const tipo = (l.tipo || '').toLowerCase();
        const cat = (l.categoria || '').toLowerCase();
        const isTransfer = cat.includes('transferência interna');

        const impact = v;

        if (tipo === 'receita') {
          movimEntrada += impact;
          console.log(`  [ENTRADA] ${l.data} ${l.descricao} | Value: ${v}`);
        } else {
          movimSaida += impact;
          console.log(`  [SAIDA] ${l.data} ${l.descricao} | Value: ${v}`);
        }

        if (!isTransfer) {
          if (tipo === 'receita') {
            pInc += v;
          } else {
            pExp += v;
          }
        }
      }
    });

    const saldoSistema = saldoAnterior + movimEntrada - movimSaida;
    console.log(`Summary for ${conta.nome}:`);
    console.log(`  Saldo Anterior: ${saldoAnterior}`);
    console.log(`  movimEntrada: ${movimEntrada}`);
    console.log(`  movimSaida: ${movimSaida}`);
    console.log(`  saldoSistema (Anterior + Entrada - Saida): ${saldoSistema}`);
    console.log(`  pInc (KPI Entrada): ${pInc}`);
    console.log(`  pExp (KPI Saida): ${pExp}`);
  });
}

run();
