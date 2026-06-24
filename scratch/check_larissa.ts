
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLarissa() {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .ilike('descricao', '%Larissa Carvalho%')
    .order('data', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  console.log(JSON.stringify(data, null, 2))
}

checkLarissa()
