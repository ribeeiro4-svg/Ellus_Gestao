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
  const { data, error } = await sb.from('plano_contas')
    .select('id, codigo, descricao')
    .or('descricao.ilike.%banco%,descricao.ilike.%caixa%')
    .limit(10)
  if (error) console.log('Error:', error.message)
  else console.log('Accounts:', JSON.stringify(data, null, 2))
}
find()
