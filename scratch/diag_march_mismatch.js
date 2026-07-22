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
  const { data: lancs } = await supabase
    .from('lancamentos')
    .select('*')
    .not('banco_transacao_id', 'is', null)

  console.log('=== LANCAMENTOS WITH banco_transacao_id ===')
  console.log('Total:', lancs?.length)

  // 1. Find those with null data_conciliacao
  const nullConc = lancs?.filter(l => !l.data_conciliacao) || []
  console.log(`\n--- NULL data_conciliacao (${nullConc.length}) ---`)
  nullConc.forEach(l => {
    console.log(`ID: ${l.id} | Desc: ${l.descricao.substring(0,40)} | R$ ${l.valor} | Tipo: ${l.tipo} | Data: ${l.data} | Status: ${l.status}`)
  })

  // 2. Let's find those that might belong to March 2026 based on their descriptions or other clues, or let's search all lancamentos in March 2026 that have status = 'pago' but banco_transacao_id is NOT null
  // Wait, let's look at all lancamentos (reconciled or not) in March 2026
  const { data: allMarch } = await supabase
    .from('lancamentos')
    .select('*')
    .or('data.gte.2026-03-01,data_conciliacao.gte.2026-03-01')
    .order('data', { ascending: true })

  const filteredMarch = allMarch?.filter(l => {
    const dStr = l.data || ''
    const dcStr = l.data_conciliacao || ''
    return dStr.startsWith('2026-03') || dcStr.startsWith('2026-03')
  }) || []

  console.log(`\n=== ALL LANCAMENTOS IN MARCH 2026 (Total: ${filteredMarch.length}) ===`)
  let totalPaidMarch = 0
  filteredMarch.forEach(l => {
    const isPaid = l.status === 'pago'
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
    const v = Number(l.valor)
    const bruto = Math.round((v + taxaVal) * 100) / 100

    if (isPaid && l.tipo === 'receita') {
      totalPaidMarch += bruto
    }
    console.log(`ID: ${l.id} | Desc: ${l.descricao.substring(0,35).padEnd(35)} | R$ ${l.valor} | Tipo: ${l.tipo} | Status: ${l.status} | Data: ${l.data} | Conc: ${l.data_conciliacao ? l.data_conciliacao.substring(0,10) : 'NULL'} | TxId: ${l.banco_transacao_id ? 'YES' : 'NO'}`)
  })
  console.log(`Total Paid Receitas: R$ ${totalPaidMarch}`)
}

main().catch(console.error)
