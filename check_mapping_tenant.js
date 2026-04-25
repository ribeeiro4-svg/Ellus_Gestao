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

async function find() {
  const { data, error } = await sb.from('contabil_mapeamento_categorias')
    .select('*')
    .eq('tenant_id', '971f92af-a72b-4bc4-a8e0-333d712ce6a7')
  if (error) console.log('Error:', error.message)
  else console.log('Mapping count:', data.length)
}
find()
