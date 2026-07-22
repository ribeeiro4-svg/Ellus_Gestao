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

if (!url || !key) { console.error('Credenciais Supabase não encontradas'); process.exit(1) }

const supabase = createClient(url, key)

async function main() {
  // 1. Lançamentos com banco_transacao_id preenchido
  const { data: comId, error: e1 } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, status, conciliado, banco_transacao_id, banco_original_memo')
    .not('banco_transacao_id', 'is', null)
    .order('data', { ascending: false })
    .limit(100)

  if (e1) { console.error('Erro:', e1.message); process.exit(1) }

  console.log(`\n=== LANÇAMENTOS COM banco_transacao_id (${comId.length} encontrados) ===`)
  comId.forEach(l => {
    console.log(`  [${l.data}] ${l.descricao?.substring(0,50).padEnd(50)} | R$ ${Number(l.valor).toFixed(2).padStart(10)} | status: ${l.status} | conciliado: ${l.conciliado} | fitid: ${l.banco_transacao_id?.substring(0,30)}`)
  })

  // 2. Lançamentos marcados como conciliado=true mas SEM banco_transacao_id
  const { data: conciliadoSemId, error: e2 } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, status, conciliado, banco_transacao_id')
    .eq('conciliado', true)
    .is('banco_transacao_id', null)
    .order('data', { ascending: false })
    .limit(50)

  if (!e2) {
    console.log(`\n=== CONCILIADOS SEM banco_transacao_id (${conciliadoSemId.length} encontrados) ===`)
    if (conciliadoSemId.length === 0) {
      console.log('  Nenhum — OK!')
    } else {
      conciliadoSemId.forEach(l => {
        console.log(`  [${l.data}] ${l.descricao?.substring(0,50).padEnd(50)} | R$ ${Number(l.valor).toFixed(2).padStart(10)} | status: ${l.status}`)
      })
    }
  }

  // 3. Lançamentos sem banco_transacao_id e status=pago (lançados manualmente como pagos)
  const { data: pagosSemId, error: e3 } = await supabase
    .from('lancamentos')
    .select('id, descricao, valor, data, status, conciliado, banco_transacao_id, forma_pagamento')
    .eq('status', 'pago')
    .is('banco_transacao_id', null)
    .order('data', { ascending: false })
    .limit(50)

  if (!e3) {
    console.log(`\n=== PAGOS SEM banco_transacao_id (${pagosSemId.length} encontrados) ===`)
    pagosSemId.forEach(l => {
      console.log(`  [${l.data}] ${l.descricao?.substring(0,50).padEnd(50)} | R$ ${Number(l.valor).toFixed(2).padStart(10)} | forma: ${l.forma_pagamento} | conciliado: ${l.conciliado}`)
    })
  }

  // 4. Resumo total
  const { count: total } = await supabase.from('lancamentos').select('id', { count: 'exact', head: true })
  const { count: totalConciliado } = await supabase.from('lancamentos').select('id', { count: 'exact', head: true }).eq('conciliado', true)
  const { count: totalComFitid } = await supabase.from('lancamentos').select('id', { count: 'exact', head: true }).not('banco_transacao_id', 'is', null)

  console.log('\n=== RESUMO GERAL ===')
  console.log(`  Total de lançamentos : ${total}`)
  console.log(`  Marcados conciliado=true : ${totalConciliado}`)
  console.log(`  Com banco_transacao_id : ${totalComFitid}`)
}

main().catch(console.error)
