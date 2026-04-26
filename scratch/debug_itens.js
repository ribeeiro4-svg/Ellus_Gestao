const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function debug() {
  const { data: nfe } = await sb.from('nfe_entradas').select('id, numero_nf').eq('numero_nf', '463625').single()
  if (!nfe) return console.log('NF not found')
  
  const { data: itens } = await sb.from('nfe_entradas_itens').select('*').eq('nfe_entrada_id', nfe.id)
  console.log('Itens for NF 463625:', itens.map(i => ({ 
    desc: i.descricao_produto, 
    dest: i.destinacao_item, 
    classificado: i.classificado 
  })))
}

debug()
