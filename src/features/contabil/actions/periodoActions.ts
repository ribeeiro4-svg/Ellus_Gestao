'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function getPeriodosAction() {
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('periodos_contabeis')
    .select('*')
    .order('competencia', { ascending: false })
  
  return { data, error: error?.message }
}

export async function fecharPeriodoAction(competencia: string) {
  const sb = await createServerSupabase()
  const { data: user } = await sb.auth.getUser()
  const { data: profile } = await sb.from('usuarios').select('tenant_id, nome').eq('id', user.user?.id).single()

  // 1. Verificar se há lançamentos desbalanceados no mês
  // (Idealmente chamaria a função de cálculo de balancete aqui)

  const { data, error } = await sb
    .from('periodos_contabeis')
    .upsert({
      tenant_id: profile?.tenant_id,
      competencia,
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      usuario_fechou: profile?.nome || 'Usuário'
    }, { onConflict: 'tenant_id,competencia' })

  return { success: !error, error: error?.message }
}

export async function reabrirPeriodoAction(id: string) {
  const sb = await createServerSupabase()
  const { error } = await sb
    .from('periodos_contabeis')
    .update({ status: 'aberto', data_fechamento: null, usuario_fechou: null })
    .eq('id', id)

  return { success: !error, error: error?.message }
}

/**
 * Função utilitária para verificar se uma data pertence a um período fechado
 */
export async function isPeriodoFechado(data: string, tenantId: string) {
  const sb = await createServerSupabase()
  const competencia = `${data.slice(0, 7)}-01`
  
  const { data: periodo } = await sb
    .from('periodos_contabeis')
    .select('status')
    .eq('tenant_id', tenantId)
    .eq('competencia', competencia)
    .maybeSingle()

  return periodo?.status === 'fechado'
}
