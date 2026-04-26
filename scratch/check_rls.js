const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env.local', 'utf8') || fs.readFileSync('.env', 'utf8')
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
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')
const sb = createClient(url, key)

async function checkRLS() {
  const { data, error } = await sb.rpc('exec_sql', {
    sql_string: `
      SELECT relrowsecurity
      FROM pg_class
      WHERE relname = 'nfse_financeiro_vinculo';
    `
  })
  console.log('RLS Enabled:', data)
  if (error) console.log('Error:', error)
}

checkRLS()
