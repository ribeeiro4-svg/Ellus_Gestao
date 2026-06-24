import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  // 1. Get one lancamento to see all columns
  const { data: sample, error: sampleErr } = await sb.from('lancamentos')
    .select('*')
    .limit(1)
  
  if (sampleErr) {
    console.error('Error:', sampleErr)
    return
  }
  
  console.log('=== COLUMNS IN lancamentos ===')
  if (sample && sample.length > 0) {
    const cols = Object.keys(sample[0]).sort()
    cols.forEach(c => console.log(`  - ${c}: ${typeof sample[0][c]} = ${JSON.stringify(sample[0][c])?.substring(0, 80)}`))
  }
  
  // 2. Find Cora PJ
  const { data: contas } = await sb.from('contas_bancarias').select('id, nome')
  const cora = contas?.find(c => c.nome.toUpperCase().includes('CORA'))
  if (!cora) { console.log('Cora not found'); return }
  console.log(`\nCora PJ ID: ${cora.id}`)

  // 3. Get all Cora PJ receitas May 2026
  const { data: lancs, error } = await sb.from('lancamentos')
    .select('*')
    .eq('conta_id', cora.id)
    .eq('tipo', 'receita')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .order('data', { ascending: true })

  if (error) { console.error('Error:', error); return }
  
  console.log(`\nTotal receitas Cora PJ em Maio: ${lancs?.length}`)
  
  let totalValor = 0
  lancs?.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    totalValor += v
    const desc = (l.descricao || '').substring(0, 80)
    const descOrig = (l.descricao_original || '').substring(0, 50)
    console.log(`  ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2).padStart(8)} | Forma=${(l.forma_pagamento || '').padEnd(12)} | Desc=${desc}`)
    if (descOrig) console.log(`      OrigDesc: ${descOrig}`)
  })
  
  console.log(`\n  Total Valor (líquido no DB): R$ ${totalValor.toFixed(2)}`)
  console.log(`  Meta (extrato Cora):         R$ 17.968,27`)
  console.log(`  Diferença:                   R$ ${(17968.27 - totalValor).toFixed(2)}`)
  
  // 4. Check conciliação data
  const { data: concData } = await sb.from('conciliacao_bancaria')
    .select('*')
    .eq('conta_id', cora.id)
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .gt('valor', 0) // Only credits
    .order('data', { ascending: true })
    .limit(5)
  
  if (concData && concData.length > 0) {
    console.log('\n=== SAMPLE conciliacao_bancaria (credits) ===')
    const cols = Object.keys(concData[0]).sort()
    console.log('Columns:', cols.join(', '))
    concData.forEach((c, i) => {
      console.log(`  ${i+1}. Valor=${c.valor} | Desc=${(c.descricao || '').substring(0, 60)} | lancamento_id=${c.lancamento_id}`)
    })
  }
}

run().catch(console.error)
