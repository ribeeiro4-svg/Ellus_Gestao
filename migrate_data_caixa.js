const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lê credenciais do .env.local
const envFile = fs.readFileSync('.env.local', 'utf8').split('\n');
let url, serviceKey;
for (const line of envFile) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
}

if (!url || !serviceKey) {
  // Fallback: tenta .env.local
  try {
    const envLocal = fs.readFileSync('.env.local', 'utf8').split('\n');
    for (const line of envLocal) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
      if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
    }
  } catch {}
}

console.log('URL:', url ? url.substring(0, 40) + '...' : 'NÃO ENCONTRADA');
console.log('Key:', serviceKey ? '***' + serviceKey.slice(-6) : 'NÃO ENCONTRADA');

if (!url || !serviceKey) {
  console.error('❌ Credenciais não encontradas. Verifique .env ou .env.local');
  process.exit(1);
}

const sb = createClient(url, serviceKey);

async function migrate() {
  console.log('\n🔄 Iniciando migração: adicionar coluna data_caixa...\n');

  // 1. Adicionar coluna data_caixa
  let err1 = null;
  try {
    const res = await sb.rpc('exec_sql', {
      sql: `ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS data_caixa date;`
    });
    err1 = res.error;
  } catch (e) {
    err1 = e;
  }

  if (err1) {
    // Tenta via query direta
    console.log('⚠️  RPC não disponível, tentando via REST...');
    // Verifica se a coluna já existe buscando 1 registro
    const { data: testData, error: testErr } = await sb
      .from('lancamentos')
      .select('data_caixa')
      .limit(1);
    
    if (testErr && testErr.message.includes('column')) {
      console.error('❌ Coluna data_caixa não existe. Execute o SQL manualmente no Supabase Dashboard:');
      console.log('\n--- SQL PARA EXECUTAR NO SUPABASE ---');
      console.log('ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS data_caixa date;');
      console.log('');
      console.log('UPDATE lancamentos');
      console.log('SET data_caixa = data_conciliacao::date');
      console.log("WHERE data_conciliacao IS NOT NULL");
      console.log("  AND data_conciliacao >= '2026-06-01'");
      console.log("  AND data_caixa IS NULL;");
      console.log('--- FIM DO SQL ---\n');
      return;
    } else {
      console.log('✅ Coluna data_caixa já existe no banco.');
    }
  } else {
    console.log('✅ Coluna data_caixa adicionada com sucesso.');
  }

  // 2. Retroativo: popula data_caixa = data_conciliacao para lançamentos conciliados a partir de jun/2026
  console.log('\n🔄 Populando retroativamente data_caixa para lançamentos conciliados de Jun/2026...');
  
  // Busca os lançamentos conciliados a partir de junho 2026 sem data_caixa
  const { data: lancamentos, error: fetchErr } = await sb
    .from('lancamentos')
    .select('id, data_conciliacao')
    .gte('data_conciliacao', '2026-06-01T00:00:00.000Z')
    .is('data_caixa', null);

  if (fetchErr) {
    console.error('❌ Erro ao buscar lançamentos:', fetchErr.message);
    return;
  }

  console.log(`   Encontrados ${lancamentos?.length || 0} lançamentos para atualizar.`);

  if (lancamentos && lancamentos.length > 0) {
    // Atualiza em lotes de 50
    const batchSize = 50;
    let updated = 0;
    for (let i = 0; i < lancamentos.length; i += batchSize) {
      const batch = lancamentos.slice(i, i + batchSize);
      const updates = batch.map(l => ({
        id: l.id,
        data_caixa: l.data_conciliacao ? l.data_conciliacao.split('T')[0] : null
      }));
      
      for (const upd of updates) {
        const { error: updErr } = await sb
          .from('lancamentos')
          .update({ data_caixa: upd.data_caixa })
          .eq('id', upd.id);
        
        if (!updErr) updated++;
        else console.error(`  ⚠️  Erro ao atualizar ${upd.id}:`, updErr.message);
      }
    }
    console.log(`   ✅ ${updated} lançamentos atualizados com data_caixa.`);
  }

  console.log('\n✅ Migração concluída!\n');
}

migrate().catch(console.error);
