const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  const { data, error } = await sb.from('bens_duraveis').select('*').limit(1)
  console.log('Check Table bens_duraveis:', { data, error })
}

check()
