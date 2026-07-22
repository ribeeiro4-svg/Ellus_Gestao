import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: ades, error } = await sb.from('lancamentos')
    .select('id, descricao, status, conta_id, banco_transacao_id, conciliado, data')
    .or('categoria.ilike.%ADESÃO%,descricao.ilike.%ADESÃO%')

  if (error) {
    console.error('Error fetching ades:', error)
    return
  }

  console.log(`Found ${ades.length} adesões in the database.`)
  
  const statusCounts: Record<string, number> = {}
  const contaCounts: Record<string, number> = {}

  for (const a of ades) {
    const st = a.status || 'null'
    statusCounts[st] = (statusCounts[st] || 0) + 1
    
    const ct = a.conta_id || 'null'
    contaCounts[ct] = (contaCounts[ct] || 0) + 1
  }

  console.log('Status Counts:', statusCounts)
  console.log('Conta Counts:', contaCounts)
  
  // Show a few that are not Cora PJ
  const notCora = ades.filter(a => a.conta_id !== '066ec451-264c-44f5-ab8e-b140aa62b368')
  console.log(`Not Cora PJ: ${notCora.length}`)
  console.log('Sample of Not Cora PJ:', notCora.slice(0, 3))
}

run().catch(console.error)
