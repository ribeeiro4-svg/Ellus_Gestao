'use server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Reprocessa os lançamentos contábeis já existentes para usarem as contas bancárias
 * específicas recém-criadas, em vez das contas genéricas.
 */
export async function atualizarBancosNoDiarioAction(providedTenantId?: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  let tenantId = providedTenantId || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  if (user) {
    const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
    if (userData?.tenant_id) tenantId = userData.tenant_id
  }

  // 1. Buscar todos os mapeamentos de bancos
  const { data: mappings } = await sb.from('configuracoes_contabeis')
    .select('*')
    .eq('tenant_id', tenantId)
    .like('categoria_nome', 'banco_%')

  if (!mappings || mappings.length === 0) return { success: true, updated: 0 }

  // 2. Buscar o plano de contas para resolver IDs
  const { data: plano } = await sb.from('plano_contas').select('id, codigo').eq('tenant_id', tenantId)
  if (!plano) return { error: 'Plano de contas não encontrado' }

  let totalUpdated = 0

  for (const map of mappings) {
    const bankId = map.categoria_nome.replace('banco_', '')
    const targetCodigo = map.conta_contabil_codigo
    const targetConta = plano.find(p => p.codigo === targetCodigo)

    if (!targetConta) continue

    // 3. Buscar lançamentos financeiros que usam este banco
    const { data: lancsFin } = await sb.from('lancamentos')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('conta_id', bankId)

    if (!lancsFin || lancsFin.length === 0) continue
    const lancsFinIds = lancsFin.map(l => l.id)

    // 4. Buscar os lançamentos contábeis correspondentes
    const { data: lancsCont } = await sb.from('lancamentos_contabeis')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('origem_id', lancsFinIds)

    if (!lancsCont || lancsCont.length === 0) continue
    const lancsContIds = lancsCont.map(l => l.id)

    // 5. Buscar as partidas desses lançamentos que apontam para as contas genéricas de banco
    // Contas genéricas: 1.1.1.01, 1.1.1.02
    const genericCodes = ['1.1.1.01', '1.1.1.02']
    const genericIds = plano.filter(p => genericCodes.includes(p.codigo)).map(p => p.id)

    if (genericIds.length === 0) continue

    const { data: partidas } = await sb.from('lancamentos_partidas')
      .select('id, conta_id')
      .in('lancamento_id', lancsContIds)
      .in('conta_id', genericIds)

    if (!partidas || partidas.length === 0) continue

    // 6. Atualizar as partidas para a nova conta específica
    const partidaIds = partidas.map(p => p.id)
    const { error: updateErr } = await sb.from('lancamentos_partidas')
      .update({ conta_id: targetConta.id })
      .in('id', partidaIds)

    if (!updateErr) {
      totalUpdated += partidaIds.length
    }
  }

  if (totalUpdated > 0) {
    const { createClient } = await import('@supabase/supabase-js')
    const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    await sbAdmin.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'REMAPEA BANCOS',
      detalhes: `Reprocessamento de bancos concluído. ${totalUpdated} partidas do Livro Diário foram atualizadas para as contas específicas dos bancos.`
    })
  }

  return { success: true, updated: totalUpdated }
}
