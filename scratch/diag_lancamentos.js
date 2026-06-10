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
  contas?.forEach(c => console.log(`ID: ${c.id} | Nome: ${c.nome} | Tipo: ${c.tipo}`))
  const coraConta = contas?.find(c => c.nome.toUpperCase().includes('CORA')) || contas?.[0]
  console.log('CORA PJ ID:', coraConta?.id)

  const { data: lancs } = await supabase
    .from('lancamentos')
    .select('*')
    .not('banco_transacao_id', 'is', null)

  console.log(`\n=== ALL RECONCILED RECEITAS (Total: ${lancs?.length}) ===`)
  
  // Let's filter for receitas
  const receitas = lancs?.filter(l => l.tipo === 'receita') || []
  console.log(`Total reconciled receitas: ${receitas.length}`)

  // Let's check those with data or data_conciliacao in March 2026
  console.log('\n--- Reconciled Receitas with March 2026 data or data_conciliacao ---')
  let marchCount = 0
  receitas.forEach(l => {
    const inMarch = (l.data && l.data.startsWith('2026-03')) || (l.data_conciliacao && l.data_conciliacao.startsWith('2026-03'))
    if (inMarch) {
      marchCount++
      console.log(`ID: ${l.id} | Desc: ${l.descricao.substring(0,40)} | Valor: R$ ${l.valor} | Status: ${l.status} | Data: ${l.data} | Conc: ${l.data_conciliacao} | Conta: ${l.conta_id} (Cora: ${l.conta_id === coraConta?.id}) | TxId: ${l.banco_transacao_id}`)
    }
  })
  console.log(`Count in March: ${marchCount}`)

  // Let's list those reconciled receitas that are NOT in March 2026 but might be the ones
  console.log('\n--- Reconciled Receitas NOT in March 2026 ---')
  receitas.forEach(l => {
    const inMarch = (l.data && l.data.startsWith('2026-03')) || (l.data_conciliacao && l.data_conciliacao.startsWith('2026-03'))
    if (!inMarch) {
      console.log(`ID: ${l.id} | Desc: ${l.descricao.substring(0,40)} | Valor: R$ ${l.valor} | Status: ${l.status} | Data: ${l.data} | Conc: ${l.data_conciliacao} | Conta: ${l.conta_id} (Cora: ${l.conta_id === coraConta?.id}) | TxId: ${l.banco_transacao_id}`)
    }
  })
}

main().catch(console.error)
