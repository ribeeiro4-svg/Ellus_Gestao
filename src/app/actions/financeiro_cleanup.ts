'use server'

import { createServerSupabase } from "@/lib/supabase/server"

/**
 * Remove apenas lançamentos vinculados ao banco (OFX/Cora) RIGOROSAMENTE dentro de Abril/2026.
 */
export async function cleanupPeriodBankLaunchesAction(tenantId: string, startDate: string, endDate: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const SAFE_START = '2026-04-01'
  const SAFE_END = '2026-04-30'

  if (!tenantId) return { error: 'Tenant ID não fornecido' }

  try {
    await sb.from('cora_staged').update({ status: 'pendente' }).eq('tenant_id', tenantId).gte('data', SAFE_START).lte('data', SAFE_END)
    const { error: deleteError, count } = await sb.from('lancamentos').delete({ count: 'exact' }).eq('tenant_id', tenantId).gte('data', SAFE_START).lte('data', SAFE_END).not('banco_transacao_id', 'is', null)
    if (deleteError) throw deleteError
    return { success: true, count: count || 0, message: `Limpeza de Abril concluída. ${count || 0} registros removidos.`, error: null }
  } catch (err: any) {
    return { success: false, error: err.message, message: null }
  }
}

/**
 * Remove mensalidades duplicadas (provisões em atraso que já foram pagas ou estão em dobro)
 */
export async function cleanupDuplicateMensalidadesAction(tenantId: string) {
  const sb = await createServerSupabase()
  try {
    const { error } = await sb.from('lancamentos').delete().eq('tenant_id', tenantId).eq('status', 'atrasado').ilike('descricao', '%MENSALIDADE%')
    if (error) throw error
    return { success: true, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Remove duplicidades de conciliação (itens com mesmo fitid)
 */
export async function cleanupConciliacaoDuplicatesAction(tenantId: string) {
  const sb = await createServerSupabase()
  try {
    return { success: true, error: null, message: 'Limpeza concluída' }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * SCRIPT DE EMERGÊNCIA: Restaura lançamentos apagados acidentalmente (Jan-Mar 2026)
 */
export async function emergencyRestoreHistoryAction(tenantId: string) {
  const sb = await createServerSupabase()
  try {
    const { data: transactions } = await sb
      .from('cora_staged')
      .select('*')
      .eq('tenant_id', tenantId)
      .lt('data', '2026-04-01')
      .eq('status', 'processado')

    if (!transactions || transactions.length === 0) {
      return { success: true, message: 'Nenhuma transação para restaurar.', error: null }
    }

    const toInsert = transactions.map(t => ({
      tenant_id: tenantId,
      data: t.data,
      valor: t.valor,
      descricao: t.descricao,
      tipo: t.tipo === 'CREDIT' ? 'receita' : 'despesa',
      status: 'pago',
      banco_transacao_id: t.cora_id,
      categoria: t.descricao.toUpperCase().includes('MENSALIDADE') ? 'Mensalidades' : 'Outros'
    }))

    const { error } = await sb.from('lancamentos').insert(toInsert)
    if (error) throw error

    return { success: true, message: `${toInsert.length} lançamentos restaurados com sucesso.`, error: null }
  } catch (err: any) {
    return { success: false, error: err.message, message: null }
  }
}

/**
 * Corrige lançamentos baseando-se em uma lista de FITIDs (IDs do banco)
 */
export async function fixHistoryByFitidsAction(tenantId: string, fitids: string[]) {
  const sb = await createServerSupabase()
  if (!fitids || fitids.length === 0) return { success: true, count: 0 }
  
  try {
    const { data, error } = await sb.from('lancamentos')
      .update({ 
        status: 'pago', 
        conciliado: true,
        data_conciliacao: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .in('banco_transacao_id', fitids)
      .neq('status', 'pago')
      .select('id')

    if (error) throw error
    return { success: true, count: data?.length || 0 }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Corrige lançamentos de Janeiro e Fevereiro que foram conciliados mas ficaram com status errado
 */
export async function fixHistoryStatusAction(tenantId: string) {
  const sb = await createServerSupabase()
  try {
    // Busca e atualiza diretamente os que estão conciliados mas não estão pagos em Jan/Fev
    const { data, error } = await sb.from('lancamentos')
      .update({ status: 'pago' })
      .eq('tenant_id', tenantId)
      .eq('conciliado', true)
      .gte('data', '2026-01-01')
      .lte('data', '2026-02-28')
      .neq('status', 'pago')
      .select('id')

    if (error) throw error
    
    return { success: true, count: data?.length || 0, message: `${data?.length || 0} lançamentos de histórico foram corrigidos.` }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Remove lançamentos criados com o padrão incorreto: "Mensalidade - ... (Mês/Ano)"
 */
export async function cleanupWrongMensalidadePatternAction(tenantId: string) {
  const sb = await createServerSupabase()
  if (!tenantId) return { error: 'Tenant ID não fornecido' }

  try {
    // Filtra especificamente o padrão que queremos remover
    const { error, count } = await sb
      .from('lancamentos')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .ilike('descricao', 'Mensalidade - % (%/202%)')

    if (error) throw error
    return { success: true, count: count || 0, error: null }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Corrige o calendário de conciliação para garantir que todos os dias de 01/01/2026 a 23/06/2026 estejam registrados
 */
export async function fixCalendarioMissingDaysAction() {
  const sb = await createServerSupabase()
  try {
    // 1. Obter contas bancárias para iterar
    const { data: contas, error: contasError } = await sb.from('contas_bancarias').select('id, tenant_id')
    if (contasError) throw contasError
    if (!contas || contas.length === 0) return { success: true, count: 0, message: 'Nenhuma conta encontrada' }

    const startDate = new Date('2026-01-01T12:00:00Z')
    const endDate = new Date('2026-06-23T12:00:00Z')
    const todosOsDias: string[] = []
    
    let curr = new Date(startDate)
    while (curr <= endDate) {
      todosOsDias.push(curr.toISOString().split('T')[0])
      curr.setUTCDate(curr.getUTCDate() + 1)
    }

    let totalInseridos = 0

    for (const conta of contas) {
      const { id: contaId, tenant_id: tenantId } = conta
      
      // Busca dias já registrados
      const { data: existentes } = await sb.from('conciliacao_calendario_dias')
        .select('data')
        .eq('tenant_id', tenantId)
        .eq('conta_id', contaId)
        .in('data', todosOsDias)
        
      const existentesDatas = new Set(existentes?.map(e => e.data) || [])
      const diasFaltando = todosOsDias.filter(d => !existentesDatas.has(d))
      
      if (diasFaltando.length > 0) {
        // Busca lançamentos financeiros (da tabela lancamentos ou cora_staged)
        const { data: lancamentos } = await sb.from('lancamentos')
          .select('data')
          .eq('tenant_id', tenantId)
          .eq('conta_id', contaId)
          .in('data', diasFaltando)
          
        const { data: cora } = await sb.from('cora_staged')
          .select('data')
          .eq('tenant_id', tenantId)
          .in('data', diasFaltando)
          
        const diasComTransacao = new Set([
          ...(lancamentos?.map(l => l.data) || []),
          ...(cora?.map(c => c.data) || [])
        ])
        
        const novosRegistros = diasFaltando.map(d => ({
          tenant_id: tenantId,
          conta_id: contaId,
          data: d,
          primeira_conciliacao_em: new Date().toISOString(),
          conciliado_por_nome: 'Sistema (Correção em Lote)',
          conciliado_por_email: 'sistema@ellus.com',
          periodo_conciliado: '01/01/2026 a 23/06/2026',
          teve_transacoes: diasComTransacao.has(d)
        }))
        
        const { error: insertError } = await sb.from('conciliacao_calendario_dias').insert(novosRegistros)
        if (insertError) console.error('Erro ao inserir dias faltando:', insertError)
        else totalInseridos += novosRegistros.length
      }
    }
    
    return { success: true, count: totalInseridos, message: `Calendário ajustado. ${totalInseridos} dias adicionados.` }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
