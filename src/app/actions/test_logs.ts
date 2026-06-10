import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sb = createClient(url, key)

async function test() {
  const { data, error } = await sb.from('financeiro_logs').select('*').order('created_at', { ascending: false }).limit(5)
  console.log('LOGS:', JSON.stringify(data, null, 2))
  if (error) console.error('ERROR:', error)
}

test()
