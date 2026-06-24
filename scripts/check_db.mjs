
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

async function check() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await sb.from('bens_duraveis_manutencoes').select('*').limit(5)
  console.log('Data:', data)
  console.log('Error:', error)
}
check()
