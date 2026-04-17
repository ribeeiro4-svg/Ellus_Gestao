
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/lancamentos?tipo=eq.receita&data=gte.2026-03-01&data=lte.2026-04-05';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  const response = await fetch(url, {
    method: 'GET', headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await response.json();
  
  const names = new Map();
  data.forEach(l => {
    const d = new Date(l.data);
    const m = d.getMonth();
    if (m === 2) { // Appearing in March
       const name = l.descricao.split('-').slice(1, 2).join('').trim();
       if (!names.has(name)) names.set(name, []);
       names.get(name).push(l);
    }
  });

  console.log('--- Duplicatas de NOMES em Março (incluindo Timezone leak) ---');
  for (const [name, items] of names.entries()) {
    if (items.length > 1) {
       console.log(`\nNome: ${name}`);
       items.forEach(i => console.log(`  ID: ${i.id} | Data: ${i.data} | Valor: ${i.valor}`));
    }
  }
}
check();
