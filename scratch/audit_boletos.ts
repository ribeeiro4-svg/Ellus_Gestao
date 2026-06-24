import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  const { data: receitas } = await sb.from('lancamentos')
    .select('id, valor, descricao, forma_pagamento, data, banco_transacao_id, conciliado, banco_original_memo')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .eq('forma_pagamento', 'Boleto')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .order('data', { ascending: true })
    .limit(20)

  if (!receitas) return

  console.log(`Boleto receitas sample (first 20):`)
  receitas.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    const hasTaxa = (l.descricao || '').includes('(Taxa:')
    const memo = (l.banco_original_memo || '').substring(0, 60)
    console.log(`  ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2).padStart(8)} | Taxa in desc=${hasTaxa ? 'YES' : 'NO '} | Conciliado=${l.conciliado ? 'S' : 'N'} | Memo=${memo}`)
    console.log(`      Desc: ${(l.descricao || '').substring(0, 80)}`)
  })

  // Count distinct valor values for boletos 
  const valorCounts: Record<string, number> = {}
  const { data: allBoletos } = await sb.from('lancamentos')
    .select('id, valor, descricao, conciliado')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .eq('forma_pagamento', 'Boleto')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')

  allBoletos?.forEach(l => {
    const v = Number(l.valor).toFixed(2)
    valorCounts[v] = (valorCounts[v] || 0) + 1
  })
  
  console.log('\n=== DISTRIBUTION of Boleto values ===')
  Object.keys(valorCounts).sort().forEach(v => {
    console.log(`  R$ ${v}: ${valorCounts[v]} boletos`)
  })

  // The KEY question: does the user want the financeiro table to show 
  // valor=50 (what was actually received after fees) or valor=52.16 (what the bank statement shows)?
  // User said: "AINDA ESTÁ DIVERGENTE DO EXTRATO" meaning they want the BANK STATEMENT value (52.16)
  
  // So the issue is: valor in DB is 50.00 for boletos, but bank shows 52.16
  // The conciliation code sets valor = bankAmt (Math.abs(t.bank.amount)) = 52.16
  // BUT if there was an "Encontro de Contas" or if the lancamento was pre-created, it might have valor=50
  
  const boletos50 = allBoletos?.filter(l => Number(l.valor) === 50) || []
  const boletos52 = allBoletos?.filter(l => Number(l.valor) > 50 && Number(l.valor) < 53) || []
  const boletosConciliados = allBoletos?.filter(l => l.conciliado) || []
  
  console.log(`\nBoletos = R$50.00: ${boletos50.length}`)
  console.log(`Boletos ~R$52.16: ${boletos52.length}`)
  console.log(`Boletos conciliados: ${boletosConciliados.length}`)
  
  // Show first few R$52 boletos
  console.log('\nSample R$52+ boletos:')
  boletos52.slice(0, 5).forEach((l, i) => {
    console.log(`  ${i+1}. Valor=${l.valor} | ${(l.descricao || '').substring(0, 70)}`)
  })
}

run().catch(console.error)
