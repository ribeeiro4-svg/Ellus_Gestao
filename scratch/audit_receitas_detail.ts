import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  // Get all receitas for May 2026
  const { data: receitas, error } = await sb.from('lancamentos')
    .select('id, valor, descricao, forma_pagamento, data, banco_original_memo, banco_transacao_id, conciliado, status')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .order('data', { ascending: true })

  if (error) { console.error('Error:', error); return }
  
  console.log(`Total receitas: ${receitas?.length}`)
  
  // Separate by forma_pagamento
  const boletos = receitas?.filter(l => l.forma_pagamento === 'Boleto') || []
  const pix = receitas?.filter(l => l.forma_pagamento === 'PIX') || []
  const transf = receitas?.filter(l => l.forma_pagamento === 'Transferência') || []
  const other = receitas?.filter(l => !['Boleto', 'PIX', 'Transferência'].includes(l.forma_pagamento || '')) || []
  
  console.log(`  Boleto: ${boletos.length}`)
  console.log(`  PIX: ${pix.length}`)
  console.log(`  Transferência: ${transf.length}`)
  console.log(`  Outros: ${other.length}`)
  
  // Sum boletos
  let totalBoletos = 0
  boletos.forEach(l => totalBoletos += Math.abs(Number(l.valor) || 0))
  console.log(`\nTotal Boletos valor: R$ ${totalBoletos.toFixed(2)}`)
  console.log(`Se cada boleto de R$50 tem taxa R$2.16:`)
  const boletos50 = boletos.filter(l => Math.abs(Number(l.valor)) === 50)
  console.log(`  Boletos de R$50: ${boletos50.length}`)
  console.log(`  Taxas faltantes: ${boletos50.length} x R$2.16 = R$ ${(boletos50.length * 2.16).toFixed(2)}`)
  
  // Total líquido
  let total = 0
  receitas?.forEach(l => total += Math.abs(Number(l.valor) || 0))
  console.log(`\nTotal líquido: R$ ${total.toFixed(2)}`)
  console.log(`+ Taxas estimadas: R$ ${(boletos50.length * 2.16).toFixed(2)}`)
  console.log(`= Total bruto estimado: R$ ${(total + boletos50.length * 2.16).toFixed(2)}`)
  console.log(`Meta do extrato: R$ 17968.27`)
  console.log(`Diferença: R$ ${(17968.27 - total - boletos50.length * 2.16).toFixed(2)}`)
  
  // Show boletos that are NOT R$50
  const boletosNon50 = boletos.filter(l => Math.abs(Number(l.valor)) !== 50)
  if (boletosNon50.length > 0) {
    console.log(`\nBoletos com valor DIFERENTE de R$50:`)
    boletosNon50.forEach((l, i) => {
      console.log(`  ${i+1}. Valor=${l.valor} | ${(l.descricao || '').substring(0, 70)}`)
    })
  }
  
  // Check if desc has "(Taxa:" info
  const withTaxaDesc = receitas?.filter(l => (l.descricao || '').includes('(Taxa:')) || []
  console.log(`\nReceitas com "(Taxa:" na descrição: ${withTaxaDesc.length}`)
  withTaxaDesc.slice(0, 5).forEach((l, i) => {
    console.log(`  ${i+1}. ${(l.descricao || '').substring(0, 80)}`)
  })
  
  // Check banco_original_memo for original bank amounts
  const withMemo = receitas?.filter(l => l.banco_original_memo) || []
  console.log(`\nReceitas com banco_original_memo: ${withMemo.length}`)
  withMemo.slice(0, 5).forEach((l, i) => {
    console.log(`  ${i+1}. Memo: ${l.banco_original_memo}`)
  })
  
  // Show all PIX to check
  console.log('\n=== PIX entries ===')
  let totalPix = 0
  pix.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    totalPix += v
    console.log(`  ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2).padStart(8)} | ${(l.descricao || '').substring(0, 60)}`)
  })
  console.log(`  Total PIX: R$ ${totalPix.toFixed(2)}`)
  
  // Show Transferência
  console.log('\n=== Transferência entries ===')
  let totalTransf = 0
  transf.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    totalTransf += v
    console.log(`  ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2).padStart(8)} | ${(l.descricao || '').substring(0, 60)}`)
  })
  console.log(`  Total Transferência: R$ ${totalTransf.toFixed(2)}`)
}

run().catch(console.error)
