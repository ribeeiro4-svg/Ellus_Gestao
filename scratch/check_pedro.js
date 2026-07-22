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

async function run() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  console.log('Buscando lançamentos do Pedro Felipe em Fevereiro...')

  const { data, error } = await sb.from('lancamentos')
    .select('*')
    .eq('tenant_id', tenantId)
    .ilike('descricao', '%PEDRO FELIPE%')
    .gte('data', '2026-02-01')
    .lte('data', '2026-02-28')

  if (error) {
    console.error('Erro:', error.message)
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}

run()
