const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('Fixing BRUNO MATOS to Bruno Matos...')
  const { data: d1, error: e1 } = await supabase
    .from('comunicados_historico')
    .update({ usuario_nome: 'Bruno Matos' })
    .eq('usuario_nome', 'BRUNO MATOS')
  
  if (e1) console.error(e1)
  else console.log('Fixed uppercase:', d1)

  console.log('Fixing new Sistema to Bruno Matos...')
  const { data: d2, error: e2 } = await supabase
    .from('comunicados_historico')
    .update({ usuario_nome: 'Bruno Matos' })
    .eq('usuario_nome', 'Sistema')

  if (e2) console.error(e2)
  else console.log('Fixed Sistema:', d2)
}

run()
