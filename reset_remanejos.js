const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb'
const sb = createClient(supabaseUrl, supabaseKey)

async function resetRemanejos() {
  console.log('--- Iniciando Busca Ampla ---')
  
  const { data: all, error: err1 } = await sb
    .from('lancamentos')
    .select('id, descricao, valor')

  if (err1) { console.error(err1); return; }

  const ecs = all.filter(l => l.descricao.includes('[ENCONTRO DE CONTAS]'))
  console.log(`Encontrados via JS filter: ${ecs.length}`)

  for (const ec of ecs) {
    console.log(`Deletando: ${ec.descricao}`)
    await sb.from('lancamentos').delete().eq('id', ec.id)
  }

  console.log('--- Concluído ---')
}

resetRemanejos()
