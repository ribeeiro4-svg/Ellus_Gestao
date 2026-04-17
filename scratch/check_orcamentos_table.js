
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/orcamentos?select=*&limit=1';
const key = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb';

async function check() {
  console.log('Verificando tabela orcamentos via REST...');
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.status === 404) {
      console.error('ERRO: Tabela "orcamentos" NÃO EXISTE (404).');
      return;
    }

    const data = await response.json();
    console.log('Tabela existe ou retornou algo.');
    console.log('Status:', response.status);
    console.log('Dados:', data);
  } catch (err) {
    console.error('Erro:', err);
  }
}

check();
