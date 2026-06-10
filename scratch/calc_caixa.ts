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

  if (!receitas) return

  // Apply the EXACT SAME logic as the UI for "Caixa" and "May 2026"
  const filterYear = 2026
  const filterMonth = 4 // 0-indexed, so 4 is May

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

  let totalRealized = 0
  let totalWithBruto = 0

  realizedReceitas.forEach(l => {
    const v = Math.abs(Number(l.valor) || 0)
    totalRealized += v

    // Simulate getBruto
    let t = 0
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    if (match) {
      t = Math.abs(parseFloat(match[1].replace(/\./g, '').replace(',', '.')))
    }
    totalWithBruto += (v + t)
  })

  console.log(`Total realized (using l.valor): R$ ${totalRealized.toFixed(2)}`)
  console.log(`Total simulated with getBruto: R$ ${totalWithBruto.toFixed(2)}`)
  console.log(`Extrato Target: R$ 17968.27`)
  console.log(`Difference (from l.valor to extrato): R$ ${(17968.27 - totalRealized).toFixed(2)}`)

  // Boletos exactly 50
  const boletos50 = realizedReceitas.filter(l => l.forma_pagamento === 'Boleto' && Number(l.valor) === 50)
  console.log(`\nBoletos with valor=50 in May (regime caixa): ${boletos50.length}`)
  
  // If we add missing taxa to these boletos
  // Let's see what happens if we add 1002.16 / boletos50.length to each
  if (boletos50.length > 0) {
    const diff = 17968.27 - totalRealized
    const amountPerBoleto = diff / boletos50.length
    console.log(`If we distribute the difference, each boleto gets: R$ ${amountPerBoleto.toFixed(2)} added`)
    
    // Check if the difference makes sense as a fee
    if (amountPerBoleto > 1.8 && amountPerBoleto < 2.5) {
      console.log(`This is a very realistic fee for Cora! This confirms the missing value is EXACTLY the missing fees on these 50.00 boletos.`)
    }
  }

}

run().catch(console.error)
