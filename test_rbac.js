const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env', 'utf8')
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('colaboradores').select('count', { count: 'exact' })
  console.log('Result:', { data, error })
}
test()
