import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: assoc } = await sb.from('associados').select('tenant_id').limit(1)
  if (!assoc || assoc.length === 0) return
  
  const tenantId = assoc[0].tenant_id

  const { data: updatedAssocs } = await sb.from('associados').select('*').eq('tenant_id', tenantId)
  
  const ativos = updatedAssocs?.filter(a => (a.status || '').toLowerCase() === 'ativo') || []
  console.log(`Total associados: ${updatedAssocs?.length}`)
  console.log(`Ativos: ${ativos.length}`)
}

run().catch(console.error)
