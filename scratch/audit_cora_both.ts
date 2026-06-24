import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  // Both Cora IDs
  const coraIds = [
    'b5eccc21-5917-4670-a269-ec61c44ed749',
    '066ec451-264c-44f5-ab8e-b140aa62b368'
  ]

  for (const coraId of coraIds) {
    console.log(`\n========== CONTA ID: ${coraId} ==========`)

    // Count lancamentos in May
    const { data: allLancs, error } = await sb.from('lancamentos')
      .select('*')
      .eq('conta_id', coraId)
      .gte('data', '2026-05-01')
      .lte('data', '2026-05-31')
      .order('data', { ascending: true })

    if (error) { console.error('Error:', error); continue }
    
    console.log(`Total lançamentos (todos): ${allLancs?.length}`)
    
    const receitas = allLancs?.filter(l => l.tipo === 'receita') || []
    const despesas = allLancs?.filter(l => l.tipo === 'despesa') || []
    
    console.log(`  Receitas: ${receitas.length}`)
    console.log(`  Despesas: ${despesas.length}`)
    
    // Total receitas
    let totalReceitas = 0
    receitas.forEach((l, i) => {
      const v = Math.abs(Number(l.valor) || 0)
      totalReceitas += v
      const desc = (l.descricao || '').substring(0, 70)
      console.log(`  REC ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2).padStart(8)} | Forma=${(l.forma_pagamento || '').padEnd(12)} | ${desc}`)
    })
    
    // Total despesas
    let totalDespesas = 0
    despesas.forEach((l, i) => {
      const v = Math.abs(Number(l.valor) || 0)
      totalDespesas += v
      const desc = (l.descricao || '').substring(0, 70)
      console.log(`  DES ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2).padStart(8)} | Forma=${(l.forma_pagamento || '').padEnd(12)} | ${desc}`)
    })
    
    console.log(`\n  Total Receitas: R$ ${totalReceitas.toFixed(2)}`)
    console.log(`  Total Despesas: R$ ${totalDespesas.toFixed(2)}`)
  }

  // Also check conciliacao_bancaria
  console.log('\n\n========== CONCILIACAO BANCARIA ==========')
  for (const coraId of coraIds) {
    const { data: concData, count } = await sb.from('conciliacao_bancaria')
      .select('*', { count: 'exact' })
      .eq('conta_id', coraId)
      .gte('data', '2026-05-01')
      .lte('data', '2026-05-31')

    console.log(`\nConta ${coraId}: ${count} registros na conciliacao_bancaria`)
    
    if (concData && concData.length > 0) {
      // Show credits
      const credits = concData.filter(c => Number(c.valor) > 0)
      const debits = concData.filter(c => Number(c.valor) < 0)
      
      let totalCred = 0
      credits.forEach(c => totalCred += Math.abs(Number(c.valor)))
      let totalDeb = 0
      debits.forEach(c => totalDeb += Math.abs(Number(c.valor)))
      
      console.log(`  Credits (entradas): ${credits.length} = R$ ${totalCred.toFixed(2)}`)
      console.log(`  Debits (saídas): ${debits.length} = R$ ${totalDeb.toFixed(2)}`)
      
      // Show a few credits
      credits.slice(0, 5).forEach((c, i) => {
        console.log(`    Cred ${i+1}. Valor=${c.valor} | lancamento_id=${c.lancamento_id ? 'yes' : 'no'} | ${(c.descricao || '').substring(0, 50)}`)
      })
    }
  }
}

run().catch(console.error)
