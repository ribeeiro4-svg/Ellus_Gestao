import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function debugSigners() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const { data: tenant } = await sb.from('tenants').select('zapsign_token').eq('id', tenantId).single()
  const token = tenant?.zapsign_token
  const baseUrl = 'https://api.zapsign.com.br/api/v1'

  const res = await fetch(`${baseUrl}/docs/?page=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  const { results } = await res.json()
  
  console.log('RECURRING SIGNERS CHECK:')
  for (const doc of results.slice(0, 5)) {
    const detailRes = await fetch(`${baseUrl}/docs/${doc.token}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const detail = await detailRes.json()
    console.log(`Doc: ${detail.name}`)
    detail.signers.forEach((s: any) => {
      console.log(` - ${s.name} (${s.email}) | CPF: ${s.cpf} | Ext: ${s.external_id}`)
    })
  }
}

debugSigners()
