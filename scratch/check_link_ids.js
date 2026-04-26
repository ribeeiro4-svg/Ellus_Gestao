const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  console.log('--- BUSCANDO NOTA ---')
  const { data: nfe, error: err1 } = await sb.from('nfe_entradas').select('id, numero_nf, tenant_id').eq('numero_nf', '463625').limit(1)
  console.log('NFe:', nfe?.[0] || 'Não encontrada', err1)

  console.log('--- BUSCANDO LANCAMENTO ---')
  // Busca por valor aproximado e descrição
  const { data: lanc, error: err2 } = await sb.from('lancamentos').select('id, descricao, valor, tenant_id').ilike('descricao', '%MAGALUPAY%').eq('valor', 740.77).limit(1)
  console.log('Lançamento:', lanc?.[0] || 'Não encontrado', err2)
}

check()
