import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  const { data: receitas } = await sb.from('lancamentos')
    .select('id, valor, descricao, forma_pagamento, data, data_conciliacao, banco_transacao_id, conciliado, status')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .gte('data', '2026-03-01')
    .lte('data', '2026-06-30')

  if (!receitas) return

  const filterYear = 2026
  const filterMonth = 4 // May

  const realizedReceitas = receitas.filter(item => {
    const statusLower = (item.status || '').toLowerCase()
    const isPaidStatus = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower)
    const isRealized = isPaidStatus || statusLower === 'parcial' || !!item.data_conciliacao

    if (!isRealized) return false

    const dateToUse = (item.data_conciliacao) 
      ? item.data_conciliacao.split('T')[0] 
      : item.data;

    const parts = dateToUse.split('-')
    const y = parseInt(parts[0])
    const m = parseInt(parts[1]) - 1

    return y === filterYear && m === filterMonth
  })

  const ec = realizedReceitas.filter(l => (l.descricao || '').includes('ENCONTRO DE CONTAS') && Number(l.valor) === 0)
  console.log(`Encontro de Contas in May (regime caixa): ${ec.length}`)
  
  if (ec.length > 0) {
    console.log(`Total missing value if they were 50.00: ${ec.length * 50.00}`)
  }

}

run().catch(console.error)
