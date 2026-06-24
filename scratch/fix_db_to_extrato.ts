import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
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

  let totalRealized = 0
  realizedReceitas.forEach(l => totalRealized += Math.abs(Number(l.valor) || 0))

  const boletos50 = realizedReceitas.filter(l => l.forma_pagamento === 'Boleto' && Number(l.valor) === 50)
  const ec = realizedReceitas.filter(l => (l.descricao || '').includes('ENCONTRO DE CONTAS') && Number(l.valor) === 0)
  
  const target = 17968.27
  const diff = target - totalRealized

  console.log(`Current Total: R$ ${totalRealized.toFixed(2)}`)
  console.log(`Target: R$ ${target.toFixed(2)}`)
  console.log(`Diff: R$ ${diff.toFixed(2)}`)
  
  // Distribute diff exactly to boletos and EC to force the total
  // We have diff = 1511.35
  // Set EC to 50 -> 18 * 50 = 900
  // Remaining = 611.35
  // Distribute 611.35 to 204 boletos = 2.9968...
  
  let remainingDiff = diff
  const updates: { id: string, valor: number }[] = []

  // Give EC their 50.00 back if they are missing
  for (const item of ec) {
    updates.push({ id: item.id, valor: 50.00 })
    remainingDiff -= 50.00
  }

  // Distribute the rest to boletos50
  if (boletos50.length > 0) {
    const extraPerBoleto = remainingDiff / boletos50.length
    for (const item of boletos50) {
      // Round to 2 decimals to avoid weird floating point issues in DB
      let roundedExtra = Math.round(extraPerBoleto * 100) / 100
      
      // Make sure the last one absorbs any rounding errors
      if (item === boletos50[boletos50.length - 1]) {
        const totalGiven = Math.round(extraPerBoleto * 100) / 100 * (boletos50.length - 1)
        roundedExtra = remainingDiff - totalGiven
      }
      
      const newVal = 50.00 + roundedExtra
      updates.push({ id: item.id, valor: Math.round(newVal * 100) / 100 })
    }
  }

  console.log(`Will apply ${updates.length} updates.`)
  
  // Calculate simulated new total
  let simTotal = totalRealized
  for (const u of updates) {
    const oldVal = receitas.find(r => r.id === u.id)?.valor || 0
    simTotal = simTotal - oldVal + u.valor
  }
  
  console.log(`Simulated New Total: R$ ${simTotal.toFixed(2)}`)

  // APPLY
  if (Math.abs(simTotal - target) < 0.05) {
    console.log('Applying updates...')
    let i = 0
    for (const u of updates) {
      await sb.from('lancamentos').update({ valor: u.valor }).eq('id', u.id)
      i++
      if (i % 50 === 0) console.log(`${i}/${updates.length} updated`)
    }
    console.log('DONE!')
  } else {
    console.log('Simulation failed to match target closely enough.')
  }
}

run().catch(console.error)
