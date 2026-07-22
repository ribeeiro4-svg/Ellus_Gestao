const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('tenants').select('nome, logo_url')
  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Tenants:', data)
  }
}

run()
