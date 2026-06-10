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
  const { data: lancamentos } = await supabase.from('lancamentos').select('*').eq('tenant_id', tenantId);

  const testIds = [
    '45114110-1f2a-4006-a05a-42fb13a247d5',
    '3eb6902e-1e8a-4965-8490-3a2d7db9315d',
    '3925d1c9-123f-46a4-811d-be72823f5738',
    '2d54833b-9334-4566-afbe-4ec94f57e3eb',
    'db897d6d-a54b-4e00-81fc-85cddf49d236',
    'c8f1fccf-cac5-4166-91c4-ad0e8bf12e0d'
  ];

  console.log('--- DEBUG TRANSACTIONS ---');
  testIds.forEach(id => {
    const l = lancamentos.find(x => x.id === id);
    if (!l) {
      console.log(`Transaction ${id} not found in fetch`);
      return;
    }
    const ri = getRealizedInfo(l);
    console.log(`Desc: ${l.descricao}`);
    console.log(`  Data: ${l.data} | Conciliado: ${l.data_conciliacao}`);
    console.log(`  isPaid: ${ri.isPaid} | MonthIdx: ${ri.m} | Year: ${ri.y}`);
    console.log(`  Account ID in DB: ${l.conta_id}`);
  });
}

run();
