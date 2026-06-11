const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: tenants, error: err1 } = await supabase.from('tenants').select('*')
  console.log('Tenants:', tenants)

  const { data: files, error: err2 } = await supabase.storage.from('logos').list()
  console.log('Arquivos em logos:', files)
}

run()
