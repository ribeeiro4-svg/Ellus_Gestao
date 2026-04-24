const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function findDuplicates() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  const { data, error } = await sb.from('lancamentos')
    .select('id, tenant_id, data, valor, descricao, banco_transacao_id, status, conciliado')
    .eq('conciliado', true)
    .order('data', { ascending: false })
    .limit(3000)

  if (error) {
    console.error(error)
    return
  }

  const counts = {}
  data.forEach(l => {
    const key = `${l.data}_${l.valor}_${l.descricao}`
    if (!counts[key]) counts[key] = []
    counts[key].push(l)
  })

  const duplicates = Object.entries(counts).filter(([k, v]) => v.length > 1)
  
  console.log(`Encontrados ${duplicates.length} grupos de duplicatas conciliadas.`)
  duplicates.slice(0, 20).forEach(([k, v]) => {
    console.log(`Grupo: ${k} | Qtd: ${v.length}`)
    v.forEach(x => console.log(`  - ID: ${x.id} | TransId: ${x.banco_transacao_id}`))
  })
}

findDuplicates()
