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
  
  // Let's get the two CORA PJ account IDs
  const cora1 = 'b5eccc21-5917-4670-a269-ec61c44ed749'
  const cora2 = '066ec451-264c-44f5-ab8e-b140aa62b368'

  const { data: allReceitas } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')

  console.log('=== CALCULATING SUMS FOR CORA PJ 1 (b5ec...) ===')
  calculateForConta(allReceitas, cora1)

  console.log('\n=== CALCULATING SUMS FOR CORA PJ 2 (066e...) ===')
  calculateForConta(allReceitas, cora2)

  // 3. Find if there are any recipes in March 2026 (by data or data_conciliacao) with banco_transacao_id that are NOT paid
  console.log('\n=== RECONCILED BUT NOT PAID/CONCILED PROPERLY? ===')
  const notPaidReconciled = allReceitas?.filter(l => l.banco_transacao_id && l.status !== 'pago') || []
  console.log('Total:', notPaidReconciled.length)
  notPaidReconciled.forEach(l => {
    console.log(`ID: ${l.id} | Desc: ${l.descricao} | R$ ${l.valor} | Status: ${l.status} | Data: ${l.data} | Conc: ${l.data_conciliacao} | Conta: ${l.conta_id}`)
  })

  // 4. Let's find all recipes in March 2026 (either data starts with 2026-03 or data_conciliacao starts with 2026-03) that have banco_transacao_id NULL but are marked paid
  console.log('\n=== PAID BUT NOT RECONCILED (banco_transacao_id is null) IN MARCH 2026 ===')
  const paidNotReconciled = allReceitas?.filter(l => !l.banco_transacao_id && l.status === 'pago' && (l.data.startsWith('2026-03') || (l.data_conciliacao && l.data_conciliacao.startsWith('2026-03')))) || []
  paidNotReconciled.forEach(l => {
    console.log(`ID: ${l.id} | Desc: ${l.descricao} | R$ ${l.valor} | Data: ${l.data} | Conc: ${l.data_conciliacao} | Conta: ${l.conta_id}`)
  })
}

function calculateForConta(receitas, contaId) {
  let sumCaixa = 0
  let sumCompetencia = 0
  const list = []

  receitas?.forEach(l => {
    if (l.conta_id !== contaId) return
    const isPaid = l.status === 'pago'
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
    const v = Number(l.valor)
    const bruto = Math.round((v + taxaVal) * 100) / 100

    const dateCaixa = (isPaid && l.data_conciliacao) ? l.data_conciliacao.substring(0,10) : l.data
    const isCaixaMarch = dateCaixa.startsWith('2026-03') && isPaid
    const isCompetenciaMarch = l.data.startsWith('2026-03')

    if (isCaixaMarch) {
      sumCaixa += bruto
      list.push({ l, bruto, type: 'caixa' })
    }
    if (isCompetenciaMarch && !isCaixaMarch) {
      list.push({ l, bruto, type: 'competencia_only' })
    }
  })

  console.log(`Regime Caixa March Total: R$ ${sumCaixa.toFixed(2)}`)
  console.log('Realized entries in March (Regime Caixa):')
  list.filter(item => item.type === 'caixa').forEach(item => {
    console.log(`  [Data:${item.l.data}|Conc:${item.l.data_conciliacao ? item.l.data_conciliacao.substring(0,10) : 'NULL'}] ${item.l.descricao.substring(0,35).padEnd(35)} | R$ ${item.l.valor} (Bruto: ${item.bruto}) | TxId: ${item.l.banco_transacao_id}`)
  })
}

main().catch(console.error)
