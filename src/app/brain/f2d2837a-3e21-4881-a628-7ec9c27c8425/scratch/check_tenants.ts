
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: tenants, error } = await supabase.from('tenants').select('id, nome')
  console.log('Tenants in DB:', tenants)
  if (error) console.error('Error fetching tenants:', error)

  const { data: mapping, error: mappingError } = await supabase.from('tenant_id_mapping').select('*')
  console.log('Mapping in DB:', mapping)
  if (mappingError) console.error('Error fetching mapping:', mappingError)
}

check()
