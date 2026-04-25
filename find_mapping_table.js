const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
function getEnv(key) {
  try {
    const content = fs.readFileSync('.env', 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '')
      }
    }
  } catch (e) {}
  return null
}
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const sb = createClient(url, key)

async function list() {
  // Use a query that is likely to work with anon key if permissions allow
  const { data, error } = await sb.from('tenants').select('id').limit(1)
  if (error) console.log('Error:', error.message)
  
  // Try to find the mapping table by testing names
  const tablesToTest = [
      'configuracoes_contabeis',
      'configuracao_contabil',
      'contabil_mapeamento_categorias',
      'contabil_configuracoes',
      'mapeamento_categorias'
  ]
  
  for (const t of tablesToTest) {
      const { error: e } = await sb.from(t).select('*').limit(1)
      if (!e) console.log(`Table exists: ${t}`)
      else if (e.code !== '42P01') console.log(`Table ${t} exists but error: ${e.message}`)
      else console.log(`Table missing: ${t}`)
  }
}
list()
