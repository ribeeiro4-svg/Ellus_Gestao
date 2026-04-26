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
  const { data, error } = await sb.from('lancamentos_partidas').select('*').limit(1)
  if (error) console.log('Error:', error.message)
  else if (data && data.length > 0) console.log('Columns:', Object.keys(data[0]))
  else {
    // Try inserting to get column error
    const { error: e2 } = await sb.from('lancamentos_partidas').insert({ lancamento_id: '00000000-0000-0000-0000-000000000000', conta_id: '00000000-0000-0000-0000-000000000000', tipo_partida: 'D', valor: 0, historico_partida: 'test', ordem: 1 })
    console.log('Insert error (expected - reveals columns):', e2?.message)
  }
}
find()
