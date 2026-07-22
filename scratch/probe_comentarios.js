
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function probe() {
  const { data, error } = await supabase.from('tarefa_comentarios').select('*').limit(1)
  if (error) {
    console.error('ERRO:', error)
    return
  }
  if (data && data.length > 0) {
    console.log('COLUNAS ENCONTRADAS:', Object.keys(data[0]))
  } else {
    console.log('TABELA VAZIA')
  }
}

probe()
