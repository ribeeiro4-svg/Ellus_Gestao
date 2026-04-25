
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testInsert() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars')
    return
  }
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const { data, error } = await sb.from('conciliacao_logs').insert({
    tenant_id: tenantId,
    logs: [{ test: 'insert' }]
  })
  if (error) {
    console.error('Error inserting into conciliacao_logs:', error)
  } else {
    console.log('Successfully inserted into conciliacao_logs:', data)
  }
}

testInsert()
