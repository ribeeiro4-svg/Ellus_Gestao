import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  // 1. Find the Cora PJ account
  const { data: contas } = await sb.from('contas_bancarias').select('id, nome')
  console.log('Contas bancárias:', contas?.map(c => `${c.id}: ${c.nome}`))
  
  const cora = contas?.find(c => c.nome.toUpperCase().includes('CORA'))
  if (!cora) {
    console.log('Cora PJ account not found')
    return
  }
  console.log(`\nUsing account: ${cora.nome} (ID: ${cora.id})`)

  // 2. Find all Cora PJ receita boleto transactions in May 2026
  const { data: lancs, error } = await sb.from('lancamentos')
    .select('id, valor, taxa, descricao, forma_pagamento, tipo, data, descricao_original')
    .eq('conta_id', cora.id)
    .eq('tipo', 'receita')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .order('data', { ascending: true })

  if (error) {
    console.error('Error fetching:', error)
    return
  }

  console.log(`\nTotal receitas Cora PJ em Maio: ${lancs?.length}`)
  
  // 3. Show all entries and their current values
  let totalNet = 0
  let totalTaxa = 0
  lancs?.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    const t = Math.abs(Number(l.taxa) || 0)
    totalNet += v
    totalTaxa += t
    const descShort = (l.descricao || '').substring(0, 60)
    console.log(`  ${i+1}. ID=${l.id} | Valor=${v.toFixed(2)} | Taxa=${t.toFixed(2)} | Bruto=${(v+t).toFixed(2)} | Forma=${l.forma_pagamento} | ${descShort}`)
  })
  
  console.log(`\n  Total Líquido: R$ ${totalNet.toFixed(2)}`)
  console.log(`  Total Taxa: R$ ${totalTaxa.toFixed(2)}`)
  console.log(`  Total Bruto: R$ ${(totalNet + totalTaxa).toFixed(2)}`)

  // 4. Find boletos that are missing taxa
  const boletosWithoutTaxa = lancs?.filter(l => {
    const hasTaxaField = Math.abs(Number(l.taxa) || 0) > 0
    const hasTaxaInDesc = (l.descricao || '').includes('(Taxa:')
    return l.forma_pagamento === 'Boleto' && !hasTaxaField && !hasTaxaInDesc
  }) || []

  console.log(`\nBoletos sem taxa: ${boletosWithoutTaxa.length}`)
  boletosWithoutTaxa.forEach((l, i) => {
    console.log(`  ${i+1}. ID=${l.id} | Valor=${l.valor} | Desc=${(l.descricao || '').substring(0, 60)}`)
  })

  // 5. Check the original OFX amounts from descricao_original  
  console.log('\n--- Checking for OFX original amounts ---')
  const pixEntries = lancs?.filter(l => l.forma_pagamento === 'PIX' || l.forma_pagamento === 'Pix') || []
  console.log(`PIX entries: ${pixEntries.length}`)
  pixEntries.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    const t = Math.abs(Number(l.taxa) || 0)
    console.log(`  PIX ${i+1}. ID=${l.id} | Valor=${v.toFixed(2)} | Taxa=${t.toFixed(2)} | Desc=${(l.descricao || '').substring(0, 80)}`)
  })

  // Now update boletos missing taxa with 2.16
  if (boletosWithoutTaxa.length > 0) {
    console.log('\n--- UPDATING boletos with taxa=2.16 ---')
    let updated = 0
    for (const l of boletosWithoutTaxa) {
      const { error: err } = await sb.from('lancamentos')
        .update({ taxa: 2.16 })
        .eq('id', l.id)
      if (!err) {
        updated++
        console.log(`  Updated ID=${l.id}`)
      } else {
        console.error(`  Error updating ID=${l.id}:`, err)
      }
    }
    console.log(`\nUpdated ${updated} of ${boletosWithoutTaxa.length} boletos`)
    
    // Recalculate totals
    const newTotalTaxa = totalTaxa + (updated * 2.16)
    console.log(`\n  Novo Total Bruto estimado: R$ ${(totalNet + newTotalTaxa).toFixed(2)}`)
  }
}

run().catch(console.error)
