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
  console.log('=== CONTAS BANCARIAS ===')
  contas?.forEach(c => console.log(`  ID: ${c.id} | Nome: ${c.nome}`))

  // Query all March 2026 receipts under regime de caixa
  // Under regime de caixa, they are paid (status = 'pago') and:
  // - either l.data_conciliacao is in March 2026
  // - or (l.data_conciliacao is null and l.data is in March 2026)
  
  // Let's fetch all paid receitas where data_conciliacao is in March 2026
  const { data: concMarch } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .gte('data_conciliacao', '2026-03-01')
    .lte('data_conciliacao', '2026-03-31T23:59:59')

  // Let's fetch all paid receitas where data_conciliacao is null but data is in March 2026
  const { data: noConcMarch } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .is('data_conciliacao', null)
    .gte('data', '2026-03-01')
    .lte('data', '2026-03-31')

  console.log(`\n=== RECEITAS PAID WITH data_conciliacao IN MARCH 2026 (Total: ${concMarch?.length || 0}) ===`)
  let sumConc = 0
  concMarch?.forEach(l => {
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
    const v = Number(l.valor)
    const bruto = Math.round((v + taxaVal) * 100) / 100
    sumConc += bruto
    console.log(`  ID: ${l.id} | Desc: ${l.descricao.substring(0,35).padEnd(35)} | Valor: R$ ${l.valor} | Bruto: R$ ${bruto} | Data: ${l.data} | Conc: ${l.data_conciliacao?.substring(0,10)} | Conta: ${l.conta_id} | TxId: ${l.banco_transacao_id}`)
  })
  console.log(`  SUM data_conciliacao in March: R$ ${sumConc.toFixed(2)}`)

  console.log(`\n=== RECEITAS PAID WITH null data_conciliacao BUT data IN MARCH 2026 (Total: ${noConcMarch?.length || 0}) ===`)
  let sumNoConc = 0
  noConcMarch?.forEach(l => {
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
    const v = Number(l.valor)
    const bruto = Math.round((v + taxaVal) * 100) / 100
    sumNoConc += bruto
    console.log(`  ID: ${l.id} | Desc: ${l.descricao.substring(0,35).padEnd(35)} | Valor: R$ ${l.valor} | Bruto: R$ ${bruto} | Data: ${l.data} | Conc: NULL | Conta: ${l.conta_id} | TxId: ${l.banco_transacao_id}`)
  })
  console.log(`  SUM null data_conciliacao in March: R$ ${sumNoConc.toFixed(2)}`)

  const totalRealizedMarch = sumConc + sumNoConc
  console.log(`\n  TOTAL REALIZED IN MARCH 2026 (REGIME CAIXA): R$ ${totalRealizedMarch.toFixed(2)}`)
}

main().catch(console.error)
