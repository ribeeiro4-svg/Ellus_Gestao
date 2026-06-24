const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env.local', 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '');
      }
    }
  } catch (e) {}
  return null;
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const sb = createClient(url, key);

async function main() {
  console.log('Buscando lançamentos conciliados de Jan a Junho de 2026...');
  
  // Pegamos todos os lançamentos conciliados de janeiro a junho de 2026
  const { data: lancamentos, error } = await sb
    .from('lancamentos')
    .select('tenant_id, conta_id, data, data_conciliacao, created_at')
    .eq('conciliado', true)
    .gte('data', '2026-01-01')
    .lte('data', '2026-06-30')
    .not('conta_id', 'is', null);

  if (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return;
  }

  console.log(`Encontrados ${lancamentos.length} lançamentos conciliados no período.`);

  // Agrupar por tenant_id + conta_id + data
  const grupos = {};
  for (const l of lancamentos) {
    const dataStr = l.data ? l.data.split('T')[0] : null;
    if (!dataStr) continue;

    const key = `${l.tenant_id}_${l.conta_id}_${dataStr}`;
    
    if (!grupos[key]) {
      grupos[key] = {
        tenant_id: l.tenant_id,
        conta_id: l.conta_id,
        data: dataStr,
        primeira_conciliacao_em: l.data_conciliacao || l.created_at || new Date().toISOString()
      };
    } else {
      const atual = new Date(grupos[key].primeira_conciliacao_em).getTime();
      const cand = new Date(l.data_conciliacao || l.created_at || new Date()).getTime();
      if (cand < atual) {
        grupos[key].primeira_conciliacao_em = l.data_conciliacao || l.created_at || new Date().toISOString();
      }
    }
  }

  const diasParaInserir = Object.values(grupos);
  console.log(`Identificados ${diasParaInserir.length} dias únicos conciliados para inserir.`);

  if (diasParaInserir.length > 0) {
    const chunkSize = 100;
    let inseridos = 0;
    
    for (let i = 0; i < diasParaInserir.length; i += chunkSize) {
      const chunk = diasParaInserir.slice(i, i + chunkSize);
      
      const { error: insertError } = await sb
        .from('conciliacao_calendario_dias')
        .upsert(chunk, { onConflict: 'tenant_id, conta_id, data' });

      if (insertError) {
        console.error('Erro ao inserir lote:', insertError);
      } else {
        inseridos += chunk.length;
      }
    }
    
    console.log(`Sucesso! ${inseridos} dias foram populados no calendário.`);
  } else {
    console.log('Nenhum dia para popular.');
  }
}

main();
