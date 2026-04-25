
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkPolicies() {
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  // We can't query pg_policies with anon key.
  // But we can try to insert and see the error again.
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const { error } = await sb.from('conciliacao_logs').insert({
    tenant_id: tenantId,
    logs: [{ test: 're-check' }]
  })
  console.log('Insert Error:', error)
}

checkPolicies()
