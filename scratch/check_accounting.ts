import { createServerSupabase } from './src/lib/supabase/server'

export async function checkAccountingIntegrity() {
  const sb = await createServerSupabase()
  
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'No user' }
  
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id
  
  const { count } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
  
  const { data: latest } = await sb.from('lancamentos_contabeis')
    .select('numero_lancamento, data_lancamento, created_at')
    .eq('tenant_id', tenantId)
    .order('numero_lancamento', { ascending: false })
    .limit(20)
    
  return { count, latest, tenantId }
}
