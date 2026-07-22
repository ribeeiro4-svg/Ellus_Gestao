import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ukfgrjcflhlgeuarxtmt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  const { data, error } = await supabase.from('comunicados_historico').select('id, status')
  console.log('Total de registros:', data?.length)
  console.log('Exemplos:', data?.slice(0, 5))
  
  // Atualizar tudo
  if (data?.length) {
    for (const row of data) {
      await supabase.from('comunicados_historico').update({ status: 'enviado' }).eq('id', row.id)
    }
    console.log('Finalizado!')
  }
}

run()
