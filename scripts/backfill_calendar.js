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
  const conta_id = '066ec451-264c-44f5-ab8e-b140aa62b368';
  const tenant_id = '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  
  console.log(`Using account ID: ${conta_id}, Tenant: ${tenant_id}`);

  // 2. Get unique dates with transactions between 2026-01-01 and 2026-06-23
  const startDate = '2026-01-01';
  const endDate = '2026-06-23';

  let hasMore = true;
  let from = 0;
  const step = 1000;
  let allLancamentos = [];

  while (hasMore) {
    const { data, error } = await sb.from('lancamentos')
      .select('data, status')
      .eq('conta_id', conta_id)
      .eq('tenant_id', tenant_id)
      .gte('data', startDate)
      .lte('data', endDate)
      .range(from, from + step - 1);

    if (error) {
      console.error('Error fetching lancamentos:', error);
      return;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allLancamentos = [...allLancamentos, ...data];
      if (data.length < step) hasMore = false;
      else from += step;
    }
  }

  const datesWithTransactions = new Set();
  allLancamentos.forEach(l => {
    // extract just YYYY-MM-DD
    const dateStr = l.data.split('T')[0];
    datesWithTransactions.add(dateStr);
  });

  console.log(`Found ${datesWithTransactions.size} unique days with transactions.`);

  // 3. Generate all dates
  const d1 = new Date(startDate + 'T12:00:00Z');
  const d2 = new Date(endDate + 'T12:00:00Z');
  const curr = new Date(d1);
  const recordsToInsert = [];

  while (curr <= d2) {
    const ds = curr.toISOString().split('T')[0];
    const teve_transacoes = datesWithTransactions.has(ds);
    
    recordsToInsert.push({
      tenant_id: tenant_id,
      conta_id: conta_id,
      data: ds,
      primeira_conciliacao_em: new Date().toISOString(),
      conciliado_por_nome: 'SISTEMA (Backfill Histórico)',
      conciliado_por_email: 'sistema@ellus.local',
      periodo_conciliado: '01/01/2026 a 23/06/2026',
      teve_transacoes: teve_transacoes
    });
    
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  console.log(`Total days to process: ${recordsToInsert.length}`);

  // 4. Upsert or Delete/Insert
  console.log('Deleting existing records in range...');
  await sb.from('conciliacao_calendario_dias')
    .delete()
    .eq('tenant_id', tenant_id)
    .eq('conta_id', conta_id)
    .gte('data', startDate)
    .lte('data', endDate);

  console.log('Inserting new records...');
  const batchSize = 100;
  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const batch = recordsToInsert.slice(i, i + batchSize);
    const { error } = await sb.from('conciliacao_calendario_dias').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    }
  }

  console.log('Backfill completed successfully!');
}

main();
