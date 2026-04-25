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
  const tables = ['logs', 'audit_logs', 'contabil_integracao_logs', 'logs_integracao', 'integracao_logs']
  for(const t of tables) {
    const { error } = await sb.from(t).select('id').limit(1)
    if(!error) console.log('Found:', t)
    else if (error.code !== '42P01') console.log('Potential match (error but exists):', t, error.message)
  }
}
find()
