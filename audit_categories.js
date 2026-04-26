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
  const { data } = await sb.from('lancamentos').select('categoria').eq('tenant_id', tenantId).limit(1000)
  const cats = {}
  data?.forEach(d => { if(d.categoria) cats[d.categoria] = (cats[d.categoria] || 0) + 1 })
  console.log('Categories in Lancamentos:', cats)
  
  const { data: config } = await sb.from('configuracoes_contabeis').select('categoria_nome').eq('tenant_id', tenantId)
  console.log('Categories in Config:', config?.map(c => c.categoria_nome))
}
find()
