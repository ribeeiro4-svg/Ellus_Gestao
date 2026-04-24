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
  const { data: profile } = await sb.from('usuarios').select('tenant_id').eq('id', user.user?.id).single()

  const { data, error } = await sb
    .from('centros_custo_contabil')
    .upsert({ ...dados, tenant_id: profile?.tenant_id })
    .select()
    .single()

  return { data, error: error?.message }
}
