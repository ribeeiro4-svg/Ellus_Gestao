
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/lancamentos?tipo=eq.receita&data=gte.2026-03-01&data=lte.2026-04-05';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await response.json();
  
  console.log('--- Listagem Expandida (Março e início de Abril) ---');
  data.sort((a,b) => a.data.localeCompare(b.data)).forEach(l => {
    const d = new Date(l.data);
    const m = d.getMonth(); // 2 is March, 3 is April
    console.log(`[${l.data}] (MonthIdx: ${m}) ${l.descricao.padEnd(30)} | R$ ${l.valor.toFixed(2).padStart(8)}`);
  });
}
check();
