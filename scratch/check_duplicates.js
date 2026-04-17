
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/lancamentos?tipo=eq.receita&data=gte.2026-03-01&data=lte.2026-03-31';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  console.log('Buscando lançamentos de março via REST API...');
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Resposta inválida:', data);
      return;
    }

    console.log(`Total encontrados: ${data.length}`);
    
    const map = new Map();
    data.forEach(l => {
      const key = `${l.data}_${l.valor}_${l.descricao}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(l);
    });

    console.log('\n--- Possíveis Duplicatas ---');
    let found = false;
    for (const [key, items] of map.entries()) {
      if (items.length > 1) {
        found = true;
        console.log(`\nChave: ${key}`);
        items.forEach(i => {
          console.log(`  ID: ${i.id} | Desc: ${i.descricao} | Valor: ${i.valor} | Conciliado: ${i.conciliado}`);
        });
      }
    }

    if (!found) console.log('Nenhuma duplicata exata encontrada por Data + Valor + Descrição.');

    const total = data.reduce((s, i) => s + (i.valor || 0), 0);
    console.log(`\nSoma Total: R$ ${total.toFixed(2)}`);
  } catch (err) {
    console.error('Erro:', err);
  }
}

check();
