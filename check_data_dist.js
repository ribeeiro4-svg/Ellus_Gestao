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
  const { count: c2026 } = await sb.from('lancamentos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('data', '2026-01-01').lte('data', '2026-12-31')
  const { count: c2027 } = await sb.from('lancamentos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('data', '2027-01-01').lte('data', '2027-12-31')
  console.log('Count 2026:', c2026)
  console.log('Count 2027:', c2027)
}
find()
