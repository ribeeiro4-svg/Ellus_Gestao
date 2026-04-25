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

async function probe() {
  const { data, error } = await sb.from('configuracoes_contabeis').select('*').limit(1)
  if (error) {
      console.log('Error:', error.message)
  } else {
      if (data.length > 0) {
          console.log('Columns:', Object.keys(data[0]))
          console.log('Data:', data[0])
      } else {
          // If empty, try to get column names from information_schema if possible, 
          // but anon key usually can't. 
          // We can try to insert a dummy row and rollback? No.
          // We can try to select specific common names.
          const commonColumns = ['id', 'tenant_id', 'categoria_nome', 'conta_contabil_codigo', 'conta_debito_id', 'conta_credito_id']
          for (const col of commonColumns) {
              const { error: e } = await sb.from('configuracoes_contabeis').select(col).limit(1)
              if (!e) console.log(`Column exists: ${col}`)
          }
      }
  }
}
probe()
