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
    .is('data_conciliacao', null)

  console.log(`=== RECONCILED LANCAMENTOS WITH null data_conciliacao (${lancs?.length || 0}) ===`)
  lancs?.forEach(l => {
    console.log(`ID: ${l.id} | Desc: ${l.descricao} | R$ ${l.valor} | Status: ${l.status} | Data: ${l.data} | TxId: ${l.banco_transacao_id}`)
  })
}

main().catch(console.error)
