
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkColumns() {
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await sb.from('lancamentos').select('*').limit(1)
  if (data && data[0]) {
    console.log('Columns:', Object.keys(data[0]))
  } else {
    console.log('No data or error:', error)
  }
}

checkColumns()
