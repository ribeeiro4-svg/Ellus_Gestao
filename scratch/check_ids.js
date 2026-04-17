
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/lancamentos?tipo=eq.receita&data=gte.2026-03-01&data=lte.2026-03-31';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await response.json();
  
  const ids = new Map();
  const fitids = new Map();
  
  console.log('--- Verificando Duplicatas por Banco ID ---');
  data.forEach(l => {
    if (l.banco_transacao_id) {
       if (!ids.has(l.banco_transacao_id)) ids.set(l.banco_transacao_id, []);
       ids.get(l.banco_transacao_id).push(l);
    }
  });

  let found = false;
  for (const [bid, items] of ids.entries()) {
    if (items.length > 1) {
      found = true;
      console.log(`\nBanco ID Duplicado: ${bid}`);
      items.forEach(i => {
        console.log(`  ID: ${i.id} | Data: ${i.data} | Desc: ${i.descricao} | Valor: ${i.valor}`);
      });
    }
  }

  if (!found) console.log('Nenhuma duplicata de Banco ID encontrada.');
}
check();
