import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const sb = createClient(supabaseUrl!, supabaseKey!)

async function check() {
  console.log('--- DIAGNÓSTICO DE TABELA ---')
  
  // 1. Verificar colunas reais da tabela tarefas
  const { data: cols, error: err } = await sb.rpc('get_table_columns', { table_name: 'tarefas' })
  if (err) {
    // Se a RPC não existir, tentamos via select de 1 linha
    const { data: one, error: err2 } = await sb.from('tarefas').select('*').limit(1)
    if (one && one.length > 0) {
      console.log('Colunas detectadas:', Object.keys(one[0]))
    } else {
      console.log('Erro ao detectar colunas:', err2)
    }
  } else {
    console.log('Colunas via RPC:', cols)
  }

  // 2. Verificar se o associado realmente existe
  const { data: assocs } = await sb.from('associados').select('id, nome').limit(5)
  console.log('Exemplos de associados no banco:', assocs)
}

check()
