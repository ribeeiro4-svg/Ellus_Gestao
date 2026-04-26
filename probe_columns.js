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
  const { data: nfe, error: nfeErr } = await sb.from('nfe_entradas').select('*').limit(1)
  if (nfe && nfe.length > 0) console.log('nfe_entradas cols:', Object.keys(nfe[0]))
  else console.log('nfe error:', nfeErr?.message)

  const { data: nfse, error: nfseErr } = await sb.from('nfse_servicos').select('*').limit(1)
  if (nfse && nfse.length > 0) console.log('nfse_servicos cols:', Object.keys(nfse[0]))
  else console.log('nfse error:', nfseErr?.message)
}
probe()
