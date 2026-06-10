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
  const ids = [
    '8bae9207-4057-45c8-a3fe-571810e063f2',
    'f3aa0216-cc4b-487b-8538-ca201dc6a4ac',
    'a113d818-8ee1-47a7-8f85-f0096ce15a74'
  ]

  for (const id of ids) {
    const { data: dest } = await supabase.from('lancamentos').select('*').eq('id', id).single()
    console.log(`\n=== DESTINATION: ${dest.descricao} ===`)
    console.log(`  ID: ${dest.id} | Valor: R$ ${dest.valor} | Data: ${dest.data} | Conc: ${dest.data_conciliacao} | TxId: ${dest.banco_transacao_id}`)

    if (dest.id_origem) {
      const { data: orig, error } = await supabase.from('lancamentos').select('*').eq('id', dest.id_origem).maybeSingle()
      if (orig) {
        console.log(`  ORIGIN: ${orig.descricao}`)
        console.log(`    ID: ${orig.id} | Valor: R$ ${orig.valor} | Data: ${orig.data} | Conc: ${orig.data_conciliacao} | TxId: ${orig.banco_transacao_id}`)
      } else {
        console.log(`  ORIGIN ID ${dest.id_origem} NOT FOUND! Error:`, error?.message)
      }
    } else {
      console.log('  No id_origem found!')
    }
  }
}

main().catch(console.error)
