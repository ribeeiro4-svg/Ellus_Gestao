const { createClient } = require('@supabase/supabase-js')

const url = 'YOUR_URL_HERE'
const key = 'YOUR_KEY_HERE'
// Wait, I don't know the URL and KEY. I can just require dotenv.
require('dotenv').config({ path: '.env.local' })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function probe() {
  const { data, error } = await sb.from('nfse_financeiro_vinculo').select('*').limit(1)
  console.log('Cols:', data?.[0] ? Object.keys(data[0]) : 'empty')
}
probe()
