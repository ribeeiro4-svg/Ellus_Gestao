import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sb = createClient(url, key)

async function test() {
  const { data, error } = await sb.from('financeiro_logs').select('tenant_id, acao, created_at').limit(10)
  console.log('--- ALL LOGS IN DB ---')
  console.log(JSON.stringify(data, null, 2))
  
  const { data: tenants } = await sb.from('tenants').select('id, nome').limit(5)
  console.log('--- TENANTS ---')
  console.log(JSON.stringify(tenants, null, 2))

  if (error) console.error('ERROR:', error)
}

test()
