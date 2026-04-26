const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function debug() {
  const { data: nfe } = await sb.from('nfe_entradas').select('*').eq('numero_nf', '463625').single()
  console.log('NFe record:', { id: nfe.id, financeiro_id: nfe.financeiro_lancamento_id, status: nfe.status_escrituracao })
  
  if (nfe.financeiro_lancamento_id) {
    const { data: fin } = await sb.from('lancamentos_financeiros').select('*').eq('id', nfe.financeiro_lancamento_id).single()
    console.log('Financial record:', fin)
  }
}

debug()
