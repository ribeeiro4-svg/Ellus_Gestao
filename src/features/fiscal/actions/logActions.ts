'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Busca logs do sistema com filtros de data e módulo
 */
export async function getLogsAction(params: { 
  module: 'contabil' | 'fiscal', 
  startDate?: string, 
  endDate?: string 
}) {
  const { module, startDate, endDate } = params
  
  try {
    const { getMyTenantIdAction } = await import('@/app/actions/tenantActions')
    const tenantId = await getMyTenantIdAction()

    const sbAdmin = createAdminSupabase()
    const table = module === 'fiscal' ? 'fiscal_logs' : 'contabil_logs'
    
    let query = sbAdmin.from(table).select('*')
    
    if (tenantId) query = query.eq('tenant_id', tenantId)
    
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`)
    }
    
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`)
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(200)
    
    if (error) {
       console.warn(`Erro ao buscar logs (${module}):`, error.message)
       // Fallback caso a tabela fiscal_logs não exista ainda
       if (module === 'fiscal' && error.message.includes('relation "fiscal_logs" does not exist')) {
         return { success: true, data: [], info: 'Tabela de logs fiscais ainda não criada.' }
       }
       return { success: false, data: [], error: 'Falha ao recuperar logs.' }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    return { success: false, data: [], error: err.message }
  }
}

/**
 * Registra um log no módulo fiscal
 */
export async function registrarLogFiscalAction(acao: string, detalhes: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
  if (!tenantId) return { error: 'Tenant ID não identificado' }

  const sbAdmin = createAdminSupabase()
  
  // Tenta inserir na fiscal_logs, se falhar cai na contabil_logs com prefixo FISCAL
  const { error } = await sbAdmin.from('fiscal_logs').insert({
    tenant_id: tenantId,
    acao,
    detalhes
  })

  if (error) {
    console.warn('Erro ao inserir em fiscal_logs, usando contabil_logs como fallback:', error.message)
    await sbAdmin.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: `FISCAL: ${acao}`,
      detalhes
    })
  }

  return { success: true }
}
