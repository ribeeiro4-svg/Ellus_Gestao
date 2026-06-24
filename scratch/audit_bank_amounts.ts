import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  // Check the OFX data stored - look for columns that might hold the bank amount
  // The conciliacao_bancaria might not exist, so let's check if there's a table with the OFX data
  
  // First, check what tables we have
  const tables = ['conciliacao_bancaria', 'extrato_bancario', 'banco_transacoes', 'transacoes_bancarias', 'ofx_transacoes']
  
  for (const table of tables) {
    const { data, error } = await sb.from(table).select('*').limit(1)
    if (error) {
      console.log(`${table}: ${error.code === '42P01' ? 'NOT FOUND' : error.message}`)
    } else {
      console.log(`${table}: EXISTS - ${data?.length} rows sample`)
      if (data && data.length > 0) {
        console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`)
      }
    }
  }
  
  // The banco_transacao_id in lancamentos stores the fitid from OFX
  // Let's check if we can use it to find the original OFX amount  
  // Get boletos with valor=50 that have banco_transacao_id
  const { data: boletos50 } = await sb.from('lancamentos')
    .select('id, valor, banco_transacao_id, banco_original_memo, descricao')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .eq('forma_pagamento', 'Boleto')
    .eq('valor', 50)
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .limit(10)

  console.log(`\n=== Boletos R$50 com banco_transacao_id ===`)
  console.log(`Total: ${boletos50?.length}`)
  boletos50?.forEach((l, i) => {
    console.log(`  ${i+1}. bank_txn_id=${l.banco_transacao_id || 'NULL'} | memo=${(l.banco_original_memo || 'NULL').substring(0, 60)}`)
  })

  // The OFX data is loaded at runtime from the file - it's not persisted in a separate table
  // The only way to know the bank amount is if it was stored in the lancamento itself
  // banco_original_memo has the memo text but not the amount
  
  // SOLUTION: Since these are all boletos of R$50 from Cora, the bank charges a fee
  // The fee varies slightly (2.01 to 2.31) but the most common is around 2.03-2.18
  // The exact values we CAN recover from the memo text patterns
  
  // Actually, the SIMPLEST and CORRECT approach: 
  // The user wants the column to show the EXTRATO value
  // For boletos paid via Cora, the extrato value = valor + taxa_boleto_cora
  // Since we can't determine the exact fee without the OFX data, 
  // we should fix the CONCILIATION CODE so that going forward it always saves the bankAmt
  // AND we need to update the 210 old boletos
  
  // For Cora boletos, the fee is typically the "taxa de compensação de boleto"
  // Let's check the despesas that are fees to see if we can cross-reference
  const { data: taxasDespesas } = await sb.from('lancamentos')
    .select('id, valor, descricao, data')
    .eq('conta_id', coraId)
    .eq('tipo', 'despesa')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .ilike('descricao', '%taxa boleto%')
    .order('data', { ascending: true })
    .limit(30)

  console.log(`\n=== Despesas de Taxa de Boleto ===`)
  console.log(`Total: ${taxasDespesas?.length}`)
  let totalTaxas = 0
  taxasDespesas?.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    totalTaxas += v
    console.log(`  ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2)} | ${l.data} | ${(l.descricao || '').substring(0, 60)}`)
  })
  console.log(`  Total taxas: R$ ${totalTaxas.toFixed(2)}`)
  
  // Also check PGTO TAXAS BANCÁRIAS
  const { data: taxasBanc } = await sb.from('lancamentos')
    .select('id, valor, descricao, data')
    .eq('conta_id', coraId)
    .eq('tipo', 'despesa')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')
    .ilike('descricao', '%taxa%')
    .order('data', { ascending: true })

  console.log(`\n=== TODAS as despesas com "taxa" ===`)
  let totalTodasTaxas = 0
  taxasBanc?.forEach((l, i) => {
    const v = Math.abs(Number(l.valor) || 0)
    totalTodasTaxas += v
    console.log(`  ${(i+1).toString().padStart(2)}. Valor=${v.toFixed(2)} | ${l.data} | ${(l.descricao || '').substring(0, 60)}`)
  })
  console.log(`  Total: R$ ${totalTodasTaxas.toFixed(2)}`)
}

run().catch(console.error)
