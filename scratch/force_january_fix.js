const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env', 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '')
      }
    }
  } catch (e) {}
  return null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const sb = createClient(url, key)

async function run() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  console.log('Iniciando FORÇA BRUTA de conciliação para Janeiro/2026...')

  // 1. Busca transações da Cora em Janeiro que foram processadas
  const { data: bankItems } = await sb.from('cora_staged')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('data', '2026-01-01')
    .lte('data', '2026-01-31')

  if (!bankItems || bankItems.length === 0) {
    console.log('Nenhuma transação bancária encontrada em Janeiro no banco de dados.');
    return;
  }

  let count = 0;
  for (const bank of bankItems) {
    // Tenta encontrar o lançamento correspondente pelo valor e data aproximada
    const { data: matches } = await sb.from('lancamentos')
      .update({ 
        status: 'pago', 
        conciliado: true, 
        banco_transacao_id: bank.cora_id || bank.fitid,
        data_conciliacao: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('valor', bank.valor)
      .gte('data', '2026-01-01')
      .lte('data', '2026-01-31')
      .neq('status', 'pago') // Apenas os que ainda não estão pagos
      .select('id, descricao')

    if (matches && matches.length > 0) {
      count += matches.length;
      matches.forEach(m => console.log(`Corrigido: ${m.descricao}`));
    }
  }

  console.log(`Fim. Total de ${count} lançamentos forçados para PAGO.`);
}

run()
