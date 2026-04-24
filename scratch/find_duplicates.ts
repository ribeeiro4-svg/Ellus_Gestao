import { createServerSupabase } from './src/lib/supabase/server'

async function findDuplicates() {
  const sb = await createServerSupabase()
  
  const { data, error } = await sb.from('lancamentos')
    .select('id, tenant_id, data, valor, descricao, banco_transacao_id, status, conciliado')
    .eq('conciliado', true)
    .order('data', { ascending: false })
    .limit(2000)

  if (error) {
    console.error(error)
    return
  }

  const counts: Record<string, any[]> = {}
  data.forEach(l => {
    const key = `${l.data}_${l.valor}_${l.descricao}`
    if (!counts[key]) counts[key] = []
    counts[key].push(l)
  })

  const duplicates = Object.entries(counts).filter(([k, v]) => v.length > 1)
  
  console.log(`Encontrados ${duplicates.length} grupos de duplicatas conciliadas.`)
  duplicates.slice(0, 10).forEach(([k, v]) => {
    console.log(`Grupo: ${k} | Qtd: ${v.length}`)
    v.forEach(x => console.log(`  - ID: ${x.id} | TransId: ${x.banco_transacao_id}`))
  })
}

findDuplicates()
