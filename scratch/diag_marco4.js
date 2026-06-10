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
  // 1. Get all contas_bancarias
  const { data: contas } = await supabase.from('contas_bancarias').select('*')
  console.log('=== CONTAS BANCARIAS ===')
  contas?.forEach(c => console.log(`ID: ${c.id} | Nome: ${c.nome} | Tipo: ${c.tipo}`))

  // Let's identify the CORA PJ account ID. It might be 066ec451-264c-44f5-ab8e-b140aa62b368
  const coraConta = contas?.find(c => c.nome.toUpperCase().includes('CORA')) || contas?.[0]
  console.log('\nCORA PJ Account identified:', coraConta?.nome, 'ID:', coraConta?.id)

  // 2. Fetch all lancamentos that have banco_transacao_id
  const { data: reconciledLancamentos } = await supabase
    .from('lancamentos')
    .select('*')
    .not('banco_transacao_id', 'is', null)

  console.log(`\n=== ALL RECONCILED LANCAMENTOS (Total: ${reconciledLancamentos?.length}) ===`)
  
  // Let's group them by month of data_conciliacao and data
  const grouped = {}
  reconciledLancamentos?.forEach(l => {
    // We want to see March 2026 ones especially, but let's print any that might be near or related
    const key = `${l.conta_id} | ${l.tipo} | data:${l.data} | conc:${l.data_conciliacao} | status:${l.status} | R$ ${l.valor}`
    console.log(`Lançamento ID: ${l.id} | Desc: ${l.descricao.substring(0, 30)} | ${key} | TxId: ${l.banco_transacao_id}`)
  })

  // 3. Let's query ALL cora_staged items to see what was synced
  const { data: coraStaged } = await supabase
    .from('cora_staged')
    .select('*')
  
  console.log(`\n=== ALL CORA STAGED ITEMS (Total: ${coraStaged?.length}) ===`)
  coraStaged?.forEach(item => {
    console.log(`Staged ID: ${item.id} | CoraID: ${item.cora_id} | Data: ${item.data} | Desc: ${item.descricao.substring(0, 30)} | R$ ${item.valor} | Tipo: ${item.tipo} | Status: ${item.status}`)
  })

  // 4. Let's find if any lancamento has a data/data_conciliacao of March 2026 and matches the difference
  // The user says the correct Cora PJ March receipts is 2,754.51 but financeiro only has 2,553.33 (diff 201.18).
  // Let's list all receipts (tipo = receita) in March 2026 (either data starts with 2026-03 or data_conciliacao starts with 2026-03)
  const { data: allMarchReceitas } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')
    .or('data.like.2026-03%,data_conciliacao.like.2026-03%')
  
  console.log(`\n=== ALL RECEITAS IN MARCH 2026 (Total: ${allMarchReceitas?.length}) ===`)
  let sumRealized = 0
  let sumAll = 0
  allMarchReceitas?.forEach(l => {
    const isPaid = l.status === 'pago'
    const isCora = l.conta_id === coraConta?.id
    if (isPaid && isCora && l.data_conciliacao?.startsWith('2026-03')) {
      sumRealized += Number(l.valor)
    }
    sumAll += Number(l.valor)
    console.log(`ID: ${l.id} | Desc: ${l.descricao.substring(0, 30)} | Data: ${l.data} | Conc: ${l.data_conciliacao} | R$ ${l.valor} | Status: ${l.status} | Conta: ${l.conta_id === coraConta?.id ? 'CORA' : l.conta_id} | TxId: ${l.banco_transacao_id}`)
  })
  console.log(`Sum of Cora March Realized Receitas: R$ ${sumRealized.toFixed(2)}`)
  console.log(`Sum of All March Receitas in query: R$ ${sumAll.toFixed(2)}`)
}

main().catch(console.error)
