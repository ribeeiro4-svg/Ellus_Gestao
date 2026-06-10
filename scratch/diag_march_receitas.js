const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env.local', 'utf8')
    for (const line of content.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k.trim() === key) return v.join('=').trim().replace(/^"|"$/g, '')
    }
  } catch {}
  try {
    const content = fs.readFileSync('.env', 'utf8')
    for (const line of content.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k.trim() === key) return v.join('=').trim().replace(/^"|"$/g, '')
    }
  } catch {}
  return null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabase = createClient(url, key)

async function main() {
  const { data: contas } = await supabase.from('contas_bancarias').select('*')
  const coraConta = contas?.find(c => c.nome.toUpperCase().includes('CORA')) || contas?.[0]
  const coraId = coraConta?.id

  // Fetch all receitas from database
  const { data: allReceitas } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')

  console.log(`=== ALL RECEITAS IN DATABASE (Total: ${allReceitas?.length}) ===`)

  // Filter recipes that have data starting with 2026-03 OR data_conciliacao starting with 2026-03
  const marchReceitas = allReceitas?.filter(l => {
    const d = l.data || ''
    const dc = l.data_conciliacao || ''
    return d.startsWith('2026-03') || dc.startsWith('2026-03')
  }) || []

  console.log(`\n=== MARCH 2026 RECEITAS (${marchReceitas.length}) ===`)
  let sumCaixa = 0
  let sumCompetencia = 0

  marchReceitas.forEach(l => {
    const isPaid = l.status === 'pago'
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
    const v = Number(l.valor)
    const bruto = Math.round((v + taxaVal) * 100) / 100

    const dateCaixa = (isPaid && l.data_conciliacao) ? l.data_conciliacao.substring(0,10) : l.data
    const isCaixaMarch = dateCaixa.startsWith('2026-03') && isPaid && l.conta_id === coraId
    const isCompetenciaMarch = l.data.startsWith('2026-03') && l.conta_id === coraId

    if (isCaixaMarch) sumCaixa += bruto
    if (isCompetenciaMarch) sumCompetencia += bruto

    console.log(`ID: ${l.id} | Desc: ${l.descricao.substring(0,35).padEnd(35)} | R$ ${l.valor} | Bruto: ${bruto} | Status: ${l.status} | Data: ${l.data} | Conc: ${l.data_conciliacao ? l.data_conciliacao.substring(0,10) : 'NULL'} | CaixaMarch: ${isCaixaMarch} | CompMarch: ${isCompetenciaMarch} | TxId: ${l.banco_transacao_id || 'NONE'}`)
  })

  console.log(`\n--- RESULTS ---`)
  console.log(`Sum Cora March Regime Caixa (Realized): R$ ${sumCaixa.toFixed(2)}`)
  console.log(`Sum Cora March Regime Competência (All): R$ ${sumCompetencia.toFixed(2)}`)
  console.log(`Cora Account ID: ${coraId}`)
}

main().catch(console.error)
