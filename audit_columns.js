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
  const { data } = await sb.from('lancamentos_contabeis').select('*').limit(1)
  if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]))
  } else {
      const cols = ['id', 'tenant_id', 'data_lancamento', 'numero_lancamento', 'historico', 'valor_total', 'origem_id', 'origem_tipo', 'usuario_id', 'usuario_nome']
      for (const c of cols) {
          const { error } = await sb.from('lancamentos_contabeis').select(c).limit(1)
          if (!error) console.log(`Column exists: ${c}`)
      }
  }
}
find()
