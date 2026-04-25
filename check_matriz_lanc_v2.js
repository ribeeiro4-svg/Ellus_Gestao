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
  const { count, error } = await sb.from('lancamentos')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', '15782181-31a9-4d9a-9cde-315cf84aec5a')
  if (error) console.log('Error:', error.message)
  else console.log('Count Matriz:', count)
}
find()
