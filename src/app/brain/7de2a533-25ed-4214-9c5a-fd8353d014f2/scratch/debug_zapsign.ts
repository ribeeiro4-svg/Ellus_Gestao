import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testZapSign() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const { data: tenant } = await sb.from('tenants').select('zapsign_token').eq('id', tenantId).single()
  
  if (!tenant?.zapsign_token) {
    console.log('No token found')
    return
  }

  const token = tenant.zapsign_token
  const baseUrl = 'https://api.zapsign.com.br/api/v1'

  console.log('Fetching first page of docs...')
  const res = await fetch(`${baseUrl}/docs/?page=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  const body = await res.json()
  const results = Array.isArray(body) ? body : (body.results || [])
  
  if (results.length === 0) {
    console.log('No docs found')
    return
  }

  const firstDocToken = results[0].token
  console.log(`Fetching detail for doc: ${firstDocToken}`)
  
  const detailRes = await fetch(`${baseUrl}/docs/${firstDocToken}/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const detail = await detailRes.json()
  
  console.log('SIGNERS DATA STRUCTURE:')
  console.log(JSON.stringify(detail.signers, null, 2))
}

testZapSign()
