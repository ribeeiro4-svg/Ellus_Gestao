import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  const { data: receitas } = await sb.from('lancamentos')
    .select('id, valor, descricao, forma_pagamento, data, banco_transacao_id, conciliado')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .order('data', { ascending: true })

  if (!receitas) return

  // Count ENCONTRO DE CONTAS  
  const ecEntries = receitas.filter(l => (l.descricao || '').includes('[ENCONTRO DE CONTAS'))
  console.log(`Total receitas: ${receitas.length}`)
  console.log(`ENCONTRO DE CONTAS (valor=0): ${ecEntries.length}`)
  console.log(`Receitas com valor > 0: ${receitas.filter(l => Number(l.valor) > 0).length}`)

  // Total
  let total = 0
  receitas.forEach(l => total += Math.abs(Number(l.valor) || 0))
  console.log(`\nTotal valor DB: R$ ${total.toFixed(2)}`)

  // The key: what value does the EXTRATO show?
  // Extrato = 17.968,27
  // DB total = 17.144,30 (inclui os ENCONTRO DE CONTAS com valor 0)
  // Diferença = 823,97
  
  // If Boletos at R$50 each should have been R$52.16 (gross):
  const boletos = receitas.filter(l => l.forma_pagamento === 'Boleto')
  console.log(`\nBoletos: ${boletos.length}`)
  let boletoTotal = 0
  boletos.forEach(l => boletoTotal += Math.abs(Number(l.valor) || 0))
  console.log(`Total boletos (valor): R$ ${boletoTotal.toFixed(2)}`)
  
  // ENCONTRO DE CONTAS that were originally PIX but valor=0 because the PIX was split
  const ecCount = ecEntries.length
  console.log(`\nENCONTRO DE CONTAS entries: ${ecCount}`)
  console.log(`Sum of EC values: R$ ${ecEntries.reduce((s, l) => s + Math.abs(Number(l.valor) || 0), 0).toFixed(2)}`)
  console.log(`Each was originally R$50 -> missing value: R$ ${(ecCount * 50).toFixed(2)}`)

  // THE REAL ISSUE: The user said the extrato shows 17.968,27 
  // But the system shows 16.966,11
  // Let's see: if we count ONLY valor > 0 entries...
  const nonZero = receitas.filter(l => Number(l.valor) > 0)
  let totalNonZero = 0
  nonZero.forEach(l => totalNonZero += Math.abs(Number(l.valor) || 0))
  console.log(`\nTotal receitas (valor > 0 only): R$ ${totalNonZero.toFixed(2)}`)
  
  // What the system actually displays depends on filters
  // Let's check: does the system filter by isRealized?
  const realizedReceitas = receitas.filter(l => {
    const st = (l.status || '').toLowerCase()
    return st === 'pago' || st === 'recebido' || l.conciliado === true
  })
  let totalRealized = 0
  realizedReceitas.forEach(l => totalRealized += Math.abs(Number(l.valor) || 0))
  console.log(`\nReceitas realizadas: ${realizedReceitas.length}`)
  console.log(`Total realizadas: R$ ${totalRealized.toFixed(2)}`)
  
  // Let me check by status
  const statusGroups: Record<string, number> = {}
  const statusCounts: Record<string, number> = {}
  receitas.forEach(l => {
    const st = l.status || 'null'
    statusGroups[st] = (statusGroups[st] || 0) + Math.abs(Number(l.valor) || 0)
    statusCounts[st] = (statusCounts[st] || 0) + 1
  })
  console.log('\nPor status:')
  Object.keys(statusGroups).forEach(st => {
    console.log(`  ${st}: ${statusCounts[st]} lançamentos = R$ ${statusGroups[st].toFixed(2)}`)
  })

  // Check conciliado
  const concilGroups: Record<string, number> = {}
  const concilCounts: Record<string, number> = {}
  receitas.forEach(l => {
    const key = l.conciliado ? 'true' : 'false'
    concilGroups[key] = (concilGroups[key] || 0) + Math.abs(Number(l.valor) || 0)
    concilCounts[key] = (concilCounts[key] || 0) + 1
  })
  console.log('\nPor conciliado:')
  Object.keys(concilGroups).forEach(k => {
    console.log(`  ${k}: ${concilCounts[k]} lançamentos = R$ ${concilGroups[k].toFixed(2)}`)
  })
}

run().catch(console.error)
