const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env.local', 'utf8')
    for (const line of content.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k.trim() === key) return v.join('=').trim()
    }
  } catch {}
  try {
    const content = fs.readFileSync('.env', 'utf8')
    for (const line of content.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k.trim() === key) return v.join('=').trim()
    }
  } catch {}
  return null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(url, key)

async function main() {
  // 1. Listar TODAS as contas
  const { data: contas } = await supabase.from('contas').select('id, nome, tipo')
  console.log('\n=== TODAS AS CONTAS ===')
  contas?.forEach(c => console.log(`  ${c.id} | ${c.nome} | ${c.tipo}`))

  // 2. Lançamentos com banco_transacao_id mas data_conciliacao FORA de março 2026
  //    que possam ter sido "reconhecidos" pelo conciliador como já existentes
  const { data: fitidForaDemarco } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, tipo, conta_id, banco_transacao_id')
    .not('banco_transacao_id', 'is', null)
    .or('data_conciliacao.is.null,data_conciliacao.lt.2026-03-01,data_conciliacao.gt.2026-03-31')

  console.log(`\n=== LANÇAMENTOS COM fitid MAS data_conciliacao FORA de Março/2026 (${fitidForaDemarco?.length}) ===`)
  fitidForaDemarco?.forEach(l => {
    const isMarcoDatos = l.data?.startsWith('2026-03')
    console.log(`  [data:${l.data}|conc:${l.data_conciliacao?.substring(0,10)||'NULL'}] ${l.descricao?.substring(0,45).padEnd(45)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | ${l.tipo} | data_março:${isMarcoDatos}`)
  })

  // 3. Verificar SE há fitids repetidos (mesma transação importada 2x)
  const { data: todosComFitid } = await supabase
    .from('lancamentos')
    .select('banco_transacao_id, id, descricao, valor, data, data_conciliacao, status')
    .not('banco_transacao_id', 'is', null)

  const contagem = {}
  todosComFitid?.forEach(l => {
    if (!contagem[l.banco_transacao_id]) contagem[l.banco_transacao_id] = []
    contagem[l.banco_transacao_id].push(l)
  })

  const duplicadosFitid = Object.entries(contagem).filter(([k, v]) => v.length > 1)
  console.log(`\n=== FITIDS DUPLICADOS (${duplicadosFitid.length}) ===`)
  duplicadosFitid.forEach(([fitid, items]) => {
    console.log(`  fitid: ${fitid.substring(0,30)}...`)
    items.forEach(i => console.log(`    -> [${i.data}|conc:${i.data_conciliacao?.substring(0,10)||'NULL'}] ${i.descricao?.substring(0,40)} | R$ ${Number(i.valor).toFixed(2)} | ${i.status}`))
  })

  // 4. Calcular receitas de março por regime de caixa (como o sistema faz)
  // Regime de caixa: se pago -> usa data_conciliacao; se aberto -> usa data
  const { data: todosMarco } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, tipo, conta_id, banco_transacao_id')
    .eq('tipo', 'receita')

  const contaId = '066ec451-264c-44f5-ab8e-b140aa62b368'
  
  // Simular o filtro regime caixa de março
  const receitasMarcoRegimeCaixa = todosMarco?.filter(l => {
    const dateToUse = l.status === 'pago' ? (l.data_conciliacao || l.data) : l.data
    const dateStr = typeof dateToUse === 'string' ? dateToUse.split('T')[0] : dateToUse
    if (!dateStr) return false
    const parts = dateStr.split('-')
    const m = parseInt(parts[1]) - 1 // 0-indexed
    const y = parseInt(parts[0])
    return m === 2 && y === 2026 && l.conta_id === contaId && l.status === 'pago'
  }) || []

  const total = receitasMarcoRegimeCaixa.reduce((s, l) => s + Number(l.valor), 0)
  console.log(`\n=== RECEITAS MARÇO (regime caixa, conta ${contaId}) ===`)
  console.log(`  Total: R$ ${total.toFixed(2)} (${receitasMarcoRegimeCaixa.length} lançamentos)`)
  console.log(`  Banco: R$ 2754.51`)
  console.log(`  Diferença: R$ ${(2754.51 - total).toFixed(2)}`)

  // 5. Quais fitids do OFX de março NÃO estão no banco? Não podemos saber sem o OFX
  //    Mas podemos ver se há transações bancárias com data em março que tem fitid
  //    apontando para um lançamento com data_conciliacao EM OUTRO MÊS
  console.log(`\n=== LANÇAMENTOS PAGOS COM data EM MARÇO mas data_conciliacao EM OUTRO MÊS ===`)
  const comaFitidDataMarco = todosMarco?.filter(l => {
    return l.data?.startsWith('2026-03') && 
           l.status === 'pago' && 
           l.banco_transacao_id &&
           l.data_conciliacao &&
           !l.data_conciliacao.startsWith('2026-03')
  }) || []
  
  console.log(`  ${comaFitidDataMarco.length} encontrado(s):`)
  comaFitidDataMarco.forEach(l => {
    console.log(`  ⚠️  [data:${l.data}|conc:${l.data_conciliacao?.substring(0,10)}] ${l.descricao?.substring(0,50)} | R$ ${Number(l.valor).toFixed(2)}`)
  })
  
  // 6. Lançamentos com data_conciliacao EM MARÇO mas conta DIFERENTE
  const { data: outrasContas } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, tipo, conta_id, banco_transacao_id')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .gte('data_conciliacao', '2026-03-01')
    .lte('data_conciliacao', '2026-03-31')
    .neq('conta_id', contaId)

  console.log(`\n=== RECEITAS PAGAS EM MARÇO EM CONTA DIFERENTE (${outrasContas?.length}) ===`)
  outrasContas?.forEach(l => {
    const conta = contas?.find(c => c.id === l.conta_id)
    console.log(`  [${l.data_conciliacao?.substring(0,10)}] ${l.descricao?.substring(0,45).padEnd(45)} | R$ ${Number(l.valor).toFixed(2)} | conta:${conta?.nome || l.conta_id}`)
  })
}

main().catch(console.error)
