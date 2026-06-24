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
  // Buscar conta CORA PJ
  const { data: contas } = await supabase.from('contas').select('id, nome')
  const coraPJ = contas?.find(c => c.nome.toUpperCase().includes('CORA'))
  console.log('Contas encontradas:', contas?.map(c => `${c.id}: ${c.nome}`).join(', '))
  console.log('Conta CORA PJ:', coraPJ ? `${coraPJ.id} - ${coraPJ.nome}` : 'NÃO ENCONTRADA')

  // Todos os lançamentos de Março 2026 com banco_transacao_id (conciliados via OFX)
  const { data: marcoConciliados } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, conciliado, tipo, conta_id, banco_transacao_id, competencia_mes, competencia_ano')
    .not('banco_transacao_id', 'is', null)
    .gte('data', '2026-03-01')
    .lte('data', '2026-03-31')
    .order('data', { ascending: true })

  console.log(`\n=== CONCILIADOS COM data em MARÇO 2026 (${marcoConciliados?.length}) ===`)
  let somaReceitas = 0
  marcoConciliados?.forEach(l => {
    const isCora = l.conta_id === coraPJ?.id
    if (l.tipo === 'receita') somaReceitas += Number(l.valor)
    console.log(`  [${l.data}] ${l.descricao?.substring(0,45).padEnd(45)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | ${l.tipo} | status:${l.status} | conta:${isCora ? 'CORA PJ' : l.conta_id} | comp:${l.competencia_mes}/${l.competencia_ano}`)
  })
  console.log(`  TOTAL RECEITAS (data=março): R$ ${somaReceitas.toFixed(2)}`)

  // Lançamentos com data_conciliacao em Março 2026
  const { data: marcoPorConciliacao } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, conciliado, tipo, conta_id, banco_transacao_id, competencia_mes, competencia_ano')
    .not('banco_transacao_id', 'is', null)
    .gte('data_conciliacao', '2026-03-01')
    .lte('data_conciliacao', '2026-03-31')
    .order('data_conciliacao', { ascending: true })

  console.log(`\n=== CONCILIADOS COM data_conciliacao em MARÇO 2026 (${marcoPorConciliacao?.length}) ===`)
  let somaReceitasConciliacao = 0
  marcoPorConciliacao?.forEach(l => {
    const isCora = l.conta_id === coraPJ?.id
    if (l.tipo === 'receita') somaReceitasConciliacao += Number(l.valor)
    console.log(`  [data:${l.data}|conc:${l.data_conciliacao}] ${l.descricao?.substring(0,35).padEnd(35)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | ${l.tipo} | status:${l.status} | conta:${isCora ? 'CORA PJ' : l.conta_id} | comp:${l.competencia_mes}/${l.competencia_ano}`)
  })
  console.log(`  TOTAL RECEITAS (data_conciliacao=março): R$ ${somaReceitasConciliacao.toFixed(2)}`)

  // Todos os RECEBIMENTOS da conta CORA PJ em março independente de origem
  if (coraPJ) {
    const { data: coraMarco } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, data, data_conciliacao, status, conciliado, tipo, banco_transacao_id, competencia_mes, competencia_ano')
      .eq('conta_id', coraPJ.id)
      .eq('tipo', 'receita')
      .eq('status', 'pago')
      .gte('data', '2026-03-01')
      .lte('data', '2026-03-31')
      .order('data', { ascending: true })

    console.log(`\n=== RECEITAS PAGAS na CORA PJ (data março) — ${coraMarco?.length} lançamentos ===`)
    let somaCoraMarco = 0
    coraMarco?.forEach(l => {
      somaCoraMarco += Number(l.valor)
      console.log(`  [${l.data}] ${l.descricao?.substring(0,45).padEnd(45)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | conciliado:${l.conciliado} | fitid:${l.banco_transacao_id ? 'SIM' : 'NÃO'}`)
    })
    console.log(`  TOTAL CORA PJ RECEITAS PAGAS (data=março): R$ ${somaCoraMarco.toFixed(2)}`)
    console.log(`  DIFERENÇA p/ extrato (2754.51): R$ ${(2754.51 - somaCoraMarco).toFixed(2)}`)
  }

  // Verificar lançamentos com fitid mas com data FORA de março (data incorreta)
  const { data: fitidsMarco } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, tipo, conta_id, competencia_mes, competencia_ano')
    .not('banco_transacao_id', 'is', null)
    .eq('competencia_mes', 2)  // Março = índice 2
    .eq('competencia_ano', 2026)

  console.log(`\n=== CONCILIADOS COM competencia=Março/2026 mas data possivelmente diferente (${fitidsMarco?.length}) ===`)
  fitidsMarco?.forEach(l => {
    const dataOk = l.data?.startsWith('2026-03')
    console.log(`  [data:${l.data}] ${l.descricao?.substring(0,40).padEnd(40)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | data_ok:${dataOk}`)
  })
}

main().catch(console.error)
