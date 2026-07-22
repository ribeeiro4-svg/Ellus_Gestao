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
  const { data: lancs } = await supabase.from('lancamentos').select('id, conta_id, valor, tipo')
  
  const countByConta = {}
  lancs?.forEach(l => {
    if (!countByConta[l.conta_id]) {
      countByConta[l.conta_id] = { total: 0, receitas: 0, despesas: 0 }
    }
    countByConta[l.conta_id].total++
    if (l.tipo === 'receita') countByConta[l.conta_id].receitas++
    else countByConta[l.conta_id].despesas++
  })

  console.log('=== DISTRIBUTION OF LANCAMENTOS BY CONTA_ID ===')
  Object.entries(countByConta).forEach(([contaId, info]) => {
    console.log(`Conta ID: ${contaId} | Total Lancamentos: ${info.total} (Receitas: ${info.receitas}, Despesas: ${info.despesas})`)
  })
}

main().catch(console.error)
