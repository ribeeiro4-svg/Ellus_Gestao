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
  // Try to query the list of tables via a postgres query or testing known tables.
  const tables = [
    'tenants', 'usuarios', 'lancamentos', 'associados', 'metas', 'projetos',
    'config_categorias', 'orcamentos', 'contas', 'banco_transacoes',
    'extratos', 'cora_staged', 'cora_transactions', 'importacao_logs',
    'conciliacoes', 'banco_contas', 'banco_extratos'
  ]

  console.log('=== TESTING TABLES ===')
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.message} (${error.code})`)
    } else {
      console.log(`✅ ${table}: Exists. Sample data:`, data)
    }
  }

  // Also query one row from lancamentos to inspect all columns
  const { data: lancSample, error: lancErr } = await supabase.from('lancamentos').select('*').limit(1)
  if (lancSample) {
    console.log('\n=== LANCAMENTOS COLUMNS ===')
    console.log(Object.keys(lancSample[0]))
  }
}

main().catch(console.error)
