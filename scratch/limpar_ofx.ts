import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  console.log('--- LIMPANDO DADOS DA CONTA CORA PJ ---')

  // 1. Delete from lancamentos
  const { data: lancs, error: errLancs } = await sb.from('lancamentos')
    .select('id, data, valor, descricao, forma_pagamento, banco_transacao_id')
    .eq('conta_id', coraId)

  if (errLancs) {
    console.error('Error fetching lancamentos:', errLancs)
  } else {
    // Keep 'Dinheiro'
    const toDelete = lancs.filter(l => l.forma_pagamento !== 'Dinheiro')
    console.log(`Found ${lancs.length} total lancamentos in Cora PJ.`)
    console.log(`Will delete ${toDelete.length} (keeping ${lancs.length - toDelete.length} Dinheiro).`)

    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map(l => l.id)
      
      // Delete in batches of 100
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const batch = idsToDelete.slice(i, i + 100)
        const { error } = await sb.from('lancamentos').delete().in('id', batch)
        if (error) console.error('Error deleting batch:', error)
      }
      console.log(`Deleted ${toDelete.length} lancamentos.`)
    }
  }

  // 2. Check and clear ofx_transactions
  const { data: ofxData, error: errOfx } = await sb.from('ofx_transactions').select('id, fitid')
  if (errOfx) {
    console.log('No ofx_transactions table found or error:', errOfx.message)
  } else if (ofxData && ofxData.length > 0) {
    console.log(`Found ${ofxData.length} records in ofx_transactions. Deleting...`)
    const ids = ofxData.map(o => o.id)
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      await sb.from('ofx_transactions').delete().in('id', batch)
    }
    console.log(`Deleted ${ofxData.length} records from ofx_transactions.`)
  } else {
    console.log('ofx_transactions is empty.')
  }

  // 3. Check and clear conciliacao_bancaria
  const { data: concData, error: errConc } = await sb.from('conciliacao_bancaria')
    .select('id')
    .eq('conta_id', coraId)
  
  if (errConc) {
    console.log('Error fetching conciliacao_bancaria:', errConc.message)
  } else if (concData && concData.length > 0) {
    console.log(`Found ${concData.length} records in conciliacao_bancaria. Deleting...`)
    const ids = concData.map(c => c.id)
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      await sb.from('conciliacao_bancaria').delete().in('id', batch)
    }
    console.log(`Deleted ${concData.length} records from conciliacao_bancaria.`)
  } else {
    console.log('conciliacao_bancaria is empty for Cora PJ.')
  }

  console.log('--- LIMPEZA CONCLUÍDA ---')
}

run().catch(console.error)
