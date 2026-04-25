const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  const content = fs.readFileSync('.env', 'utf8')
  const lines = content.split('\n')
  for (const line of lines) {
    if (line.trim().startsWith(key + '=')) {
      return line.split('=')[1].trim().replace(/^"|"$/g, '')
    }
  }
  return null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

const supabase = createClient(url, key)
async function probe() {
  const { data, error } = await supabase.from('regras_classificacao_fiscal').select('*').limit(1)
  if (error) console.log('Error:', error.message)
  else console.log('Columns:', Object.keys(data[0]))
}
probe()
