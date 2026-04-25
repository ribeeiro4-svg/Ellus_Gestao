
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testInsertLancamento() {
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const { data, error } = await sb.from('lancamentos').insert({
    tenant_id: tenantId,
    data: '2026-01-01',
    descricao: 'Test Insert',
    tipo: 'receita',
    valor: 1,
    status: 'aberto'
  })
  console.log('Insert Lancamento Error:', error)
}

testInsertLancamento()
