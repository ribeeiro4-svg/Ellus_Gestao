
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkUsers() {
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await sb.from('usuarios').select('*')
  console.log('Usuarios:', data, 'Error:', error)
}

checkUsers()
