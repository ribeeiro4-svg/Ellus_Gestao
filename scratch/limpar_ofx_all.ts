import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  console.log('--- LIMPANDO TODOS OS DADOS DA CONTA CORA PJ ---')

  let hasMore = true
  let totalDeleted = 0

  while (hasMore) {
    const { data: lancs, error: errLancs } = await sb.from('lancamentos')
      .select('id, forma_pagamento')
      .eq('conta_id', coraId)
      .neq('forma_pagamento', 'Dinheiro')
      .limit(1000)

    if (errLancs) {
      console.error('Error fetching lancamentos:', errLancs)
      break
    }

    if (!lancs || lancs.length === 0) {
      hasMore = false
      break
    }

    console.log(`Found batch of ${lancs.length} lancamentos to delete...`)
    const idsToDelete = lancs.map(l => l.id)
    
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100)
      const { error } = await sb.from('lancamentos').delete().in('id', batch)
      if (error) {
        console.error('Error deleting batch:', error)
      } else {
        totalDeleted += batch.length
      }
    }
  }

  console.log(`\nDeleted a total of ${totalDeleted} lancamentos da Cora PJ.`)
  
  // Verify what is left
  const { count } = await sb.from('lancamentos').select('*', { count: 'exact', head: true }).eq('conta_id', coraId)
  console.log(`Remaining lancamentos in Cora PJ: ${count}`)

  console.log('--- LIMPEZA CONCLUÍDA ---')
}

run().catch(console.error)
