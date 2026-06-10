import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  const { data: receitas } = await sb.from('lancamentos')
    .select('id, valor, descricao, forma_pagamento, data, banco_transacao_id, conciliado, status, banco_original_memo')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')

  if (!receitas) return

  // Calculate exactly how much is needed to reach 17968.27
  // If we assume ALL boletos = 50 should be bumped to match the total.
  // Wait, let's see which ones have banco_transacao_id (meaning they were in the OFX)
  const ofxlancs = receitas.filter(l => l.banco_transacao_id)
  let ofxTotal = 0
  ofxlancs.forEach(l => ofxTotal += Math.abs(Number(l.valor) || 0))
  console.log(`OFX Lancamentos Total: R$ ${ofxTotal.toFixed(2)} (Count: ${ofxlancs.length})`)

  // And those without OFX link?
  const nonOfxLancs = receitas.filter(l => !l.banco_transacao_id && Number(l.valor) > 0)
  let nonOfxTotal = 0
  nonOfxLancs.forEach(l => nonOfxTotal += Math.abs(Number(l.valor) || 0))
  console.log(`Non-OFX Lancamentos Total: R$ ${nonOfxTotal.toFixed(2)} (Count: ${nonOfxLancs.length})`)
}

run().catch(console.error)
