'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getFinanceiroLogsAction(params: { 
  startDate?: string, 
  endDate?: string 
}) {
  const { startDate, endDate } = params
  
  try {
    const { getMyTenantIdAction } = await import('@/app/actions/tenantActions')
    const tenantId = await getMyTenantIdAction()

    const sbAdmin = createAdminSupabase()
    console.log('[Logs] Buscando para Tenant:', tenantId, 'Periodo:', startDate, 'até', endDate)
    let query = sbAdmin.from('financeiro_logs').select('*')
    
    // if (tenantId) query = query.eq('tenant_id', tenantId)
    // if (startDate) query = query.gte('created_at', `${startDate}T00:00:00`)
    // if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`)
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500)
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('Erro ao buscar logs financeiros:', err)
    return { success: false, data: [], error: err.message }
  }
}

export async function registrarLogFinanceiroAction(acao: string, detalhes: string) {
  const { getMyTenantIdAction } = await import('@/app/actions/tenantActions')
  const tenantId = await getMyTenantIdAction()
  
  if (!tenantId) return { error: 'Tenant ID não identificado' }

  const sbAdmin = createAdminSupabase()
  const { error } = await sbAdmin.from('financeiro_logs').insert({
    tenant_id: tenantId,
    acao,
    detalhes
  })

  if (error) {
    if (error.message.includes('schema cache')) {
        // Tabela ausente, ignorar silenciosamente para não poluir logs
        return { error: 'Tabela ausente' }
    }
    console.error('[Logs] Erro ao registrar:', error.message, 'Tenant:', tenantId)
    return { error: error.message }
  }

  console.log('[Logs] Registro OK:', acao)
  return { success: true }
}
