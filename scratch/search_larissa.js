
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/lancamentos?descricao=ilike.*Larissa*';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  const response = await fetch(url, {
    method: 'GET', headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await response.json();
  data.forEach(l => console.log(`[${l.data}] ${l.status.padEnd(8)} | ${l.descricao} | R$ ${l.valor}`));
}
check();
