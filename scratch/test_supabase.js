
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function test() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars')
    return
  }
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await sb.from('conciliacao_logs').select('*').limit(1)
  if (error) {
    console.error('Error selecting from conciliacao_logs:', error)
  } else {
    console.log('Successfully selected from conciliacao_logs:', data)
  }
}

test()
