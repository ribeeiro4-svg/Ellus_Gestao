
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/lancamentos?tipo=eq.receita&data=gte.2026-03-01&data=lte.2026-03-31';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await response.json();
  
  console.log('--- Listagem de Receitas de Março ---');
  data.sort((a,b) => a.data.localeCompare(b.data)).forEach(l => {
    console.log(`[${l.data}] ${l.descricao.padEnd(30)} | R$ ${l.valor.toFixed(2).padStart(8)} | Status: ${l.status}`);
  });
}
check();
