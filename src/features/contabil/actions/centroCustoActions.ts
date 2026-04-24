'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function getCentrosCustoAction() {
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('centros_custo_contabil')
    .select('*')
    .eq('ativo', true)
    .order('codigo', { ascending: true })
  
  return { data, error: error?.message }
}

export async function upsertCentroCustoAction(dados: any) {
  const sb = await createServerSupabase()
  const { data: user } = await sb.auth.getUser()
  const { data: profile } = await sb.from('profiles').select('tenant_id').eq('id', user.user?.id).single()
  const tenantId = profile?.tenant_id || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  const { data, error } = await sb
    .from('centros_custo_contabil')
    .upsert({ ...dados, tenant_id: tenantId })
    .select()
    .single()

  return { data, error: error?.message }
}
