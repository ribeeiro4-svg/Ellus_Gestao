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
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const { data: integrated } = await sb.from('lancamentos_contabeis').select('origem_id').eq('tenant_id', tenantId).eq('origem_tipo', 'financeiro')
  console.log('Integrated count:', integrated ? integrated.length : 0)
}
find()
