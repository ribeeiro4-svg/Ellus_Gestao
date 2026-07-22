
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function probe() {
  const { data, error } = await supabase.from('lancamentos').select('*').limit(1)
  if (error) {
    console.error(error)
    return
  }
  console.log('COLUNAS ENCONTRADAS:', Object.keys(data[0]))
  console.log('EXEMPLO DE DADO:', data[0])
}

probe()
