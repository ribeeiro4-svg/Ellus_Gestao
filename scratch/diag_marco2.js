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
  // Buscar a conta CORA PJ
  const { data: contas } = await supabase.from('contas').select('id, nome')
  const coraPJ = contas?.find(c => c.nome.toUpperCase().includes('CORA'))
  console.log('Conta CORA PJ:', coraPJ?.id, '-', coraPJ?.nome)
  
  // Todos os lançamentos com banco_transacao_id cujo fitid seria reconhecido como "existingTxIds"
  // MAS que não estão aparecendo no Fluxo de Caixa de março
  // O Fluxo de Caixa usa regime de caixa: data_conciliacao para pagos, data para abertos
  // Filtra: status = pago E data_conciliacao em março (ou status=aberto E data em março)
  
  // Verificar lançamentos com banco_transacao_id mas status=aberto (não pago!)
  const { data: abertosComFitid } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, conciliado, tipo, conta_id, banco_transacao_id')
    .not('banco_transacao_id', 'is', null)
    .neq('status', 'pago')

  console.log(`\n=== COM banco_transacao_id mas STATUS != 'pago' (${abertosComFitid?.length}) ===`)
  if (abertosComFitid?.length === 0) {
    console.log('  Nenhum — OK!')
  } else {
    abertosComFitid?.forEach(l => {
      console.log(`  [${l.data}] ${l.descricao?.substring(0,50).padEnd(50)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | status:${l.status} | conciliado:${l.conciliado}`)
    })
  }

  // Verificar lançamentos com banco_transacao_id cujo data_conciliacao está FORA de março mas data está em março
  const { data: fitidsDatas } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, tipo, conta_id, banco_transacao_id')
    .not('banco_transacao_id', 'is', null)
    .gte('data', '2026-03-01')
    .lte('data', '2026-03-31')
    .eq('status', 'pago')

  console.log(`\n=== PAGOS COM data em Março/2026 (${fitidsDatas?.length}) ===`)
  fitidsDatas?.forEach(l => {
    const concYear = l.data_conciliacao ? l.data_conciliacao.substring(0, 7) : 'NULL'
    const isCora = l.conta_id === coraPJ?.id
    console.log(`  [data:${l.data}|conc:${concYear}] ${l.descricao?.substring(0,40).padEnd(40)} | R$ ${Number(l.valor).toFixed(2).padStart(8)} | ${l.tipo} | cora:${isCora}`)
  })

  // O Fluxo de Caixa no regime de caixa usa data_conciliacao para pagos
  // Então se data_conciliacao não está em março, não aparece no filtro de março
  console.log('\n=== VERIFICAÇÃO: PAGOS COM data EM março MAS data_conciliacao FORA de março ===')
  fitidsDatas?.forEach(l => {
    const concMes = l.data_conciliacao ? l.data_conciliacao.substring(0, 7) : null
    if (concMes !== '2026-03') {
      console.log(`  ⚠️  [data:${l.data}|conc:${l.data_conciliacao}] ${l.descricao?.substring(0,50)} | R$ ${Number(l.valor).toFixed(2)}`)
    }
  })
  
  // Verificar lançamentos com banco_transacao_id mas conta != CORA PJ
  const { data: outraConta } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, status, tipo, conta_id, banco_transacao_id')
    .not('banco_transacao_id', 'is', null)
    .gte('data_conciliacao', '2026-03-01')
    .lte('data_conciliacao', '2026-03-31')
    .eq('tipo', 'receita')

  console.log(`\n=== RECEITAS CONCILIADAS EM MARÇO POR CONTA ===`)
  const porConta = {}
  outraConta?.forEach(l => {
    const conta = l.conta_id === coraPJ?.id ? 'CORA PJ' : (l.conta_id || 'NULL')
    if (!porConta[conta]) porConta[conta] = { soma: 0, items: [] }
    porConta[conta].soma += Number(l.valor)
    porConta[conta].items.push(l)
  })
  
  Object.entries(porConta).forEach(([conta, dados]) => {
    console.log(`\n  Conta: ${conta} — Total: R$ ${dados.soma.toFixed(2)}`)
    dados.items.forEach((l) => {
      console.log(`    [${l.data_conciliacao?.substring(0,10)}] ${l.descricao?.substring(0,50).padEnd(50)} | R$ ${Number(l.valor).toFixed(2)}`)
    })
  })

  // Calcular diferença
  const somaCoraReceitasMarco = outraConta
    ?.filter(l => l.conta_id === coraPJ?.id)
    .reduce((s, l) => s + Number(l.valor), 0) || 0
  
  console.log(`\n=== RESUMO FINAL ===`)
  console.log(`  Total receitas CORA PJ (conc.=março): R$ ${somaCoraReceitasMarco.toFixed(2)}`)
  console.log(`  Total banco (extrato):                R$ 2754.51`)
  console.log(`  Diferença:                            R$ ${(2754.51 - somaCoraReceitasMarco).toFixed(2)}`)
}

main().catch(console.error)
