'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sincronizarLancamentoContabil } from './accountingActions'
import { getMyTenantIdAction } from '@/app/actions/tenantActions'

/**
 * Ação de Saneamento Contábil: Varre todos os lançamentos integrados e os corrige
 * com base nas novas regras de auditoria (Aluguel, Taxas, Inversões e Espécie).
 */
export async function executarSaneamentoContabilAction(providedTenantId?: string, periodo?: string) {
  const sb = await createServerSupabase()
  
  // 0. Detectar tenantId de forma robusta
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado', fixedCount: 0, errorCount: 0, renamedCount: 0 }
  
  const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id || providedTenantId || await getMyTenantIdAction()
  if (!tenantId) return { error: 'Tenant ID não identificado', fixedCount: 0, errorCount: 0, renamedCount: 0 }

  // 0.1 Calcular datas se houver período (YYYY-MM)
  let startDate: string | null = null
  let endDate: string | null = null
  if (periodo && periodo !== 'all') {
    startDate = `${periodo}-01`
    const [year, month] = periodo.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    endDate = `${periodo}-${String(lastDay).padStart(2, '0')}`
  }

  // 1. Buscar lançamentos contábeis vinculados ao financeiro
  let queryLancs = sb.from('lancamentos_contabeis')
    .select('id, origem_id')
    .eq('tenant_id', tenantId)
    .not('origem_id', 'is', null)
  
  if (startDate && endDate) {
    queryLancs = queryLancs.gte('data_lancamento', startDate).lte('data_lancamento', endDate)
  }

  const { data: lancsContData } = await queryLancs

  let itemsToProcess = (lancsContData || []).map(l => ({ id: l.id, origem_id: l.origem_id }))

  // Se o diário estiver vazio ou filtrado, buscamos no financeiro para integrar
  if (itemsToProcess.length === 0) {
    let queryFin = sb.from('lancamentos')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('status', ['pago', 'conciliado', 'liquidado', 'PAGO', 'CONCILIADO', 'LIQUIDADO'])
    
    if (startDate && endDate) {
      queryFin = queryFin.gte('data', startDate).lte('data', endDate)
    }

    const { data: allFin } = await queryFin
    
    if (allFin) {
      itemsToProcess = allFin.map(f => ({ id: null as any, origem_id: f.id }))
    }
  }

  if (itemsToProcess.length === 0) {
    return { success: true, fixedCount: 0, errorCount: 0, renamedCount: 0, message: 'Nenhum lançamento pendente de integração.' }
  }

  // 2. Buscar dados do financeiro (simplificado para evitar Bad Request)
  const financialIds = itemsToProcess.map(i => i.origem_id).filter(Boolean)
  
  // Buscar em blocos de 50 para evitar limites de URL/Bad Request
  let allLancsFin: any[] = []
  for (let i = 0; i < financialIds.length; i += 50) {
    const chunk = financialIds.slice(i, i + 50)
    const { data: finChunk } = await sb.from('lancamentos')
      .select('*')
      .in('id', chunk)
    if (finChunk) allLancsFin = [...allLancsFin, ...finChunk]
  }

  if (allLancsFin.length === 0) {
    return { error: 'Dados financeiros não encontrados.', fixedCount: 0, errorCount: 0, renamedCount: 0 }
  }

  // 3. ORDENAÇÃO CRONOLÓGICA: Essencial para que a sequência numérica siga a data real.
  allLancsFin.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  let fixedCount = 0
  let errorCount = 0
  let renamedCount = 0

  const sbAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!sbAdminUrl || !sbAdminKey) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.', fixedCount: 0, errorCount: 0, renamedCount: 0 }
  }

  const sbAdmin = createClient(sbAdminUrl, sbAdminKey)

  // --- LIMPEZA PRÉVIA (SLATE CLEAN) FORA DO LOOP ---
  console.log(`[Contábil] Limpando ${itemsToProcess.length} itens antigos para reconstrução de sequência...`)
  const oldIds = itemsToProcess.map(i => i.id).filter(Boolean)
  if (oldIds.length > 0) {
    for (let i = 0; i < oldIds.length; i += 100) {
      const chunk = oldIds.slice(i, i + 100)
      await sbAdmin.from('lancamentos_partidas').delete().in('lancamento_id', chunk)
      await sbAdmin.from('lancamentos_contabeis').delete().in('id', chunk)
    }
  } else {
     const fIds = allLancsFin.map(f => f.id)
     for (let i = 0; i < fIds.length; i += 100) {
        const chunk = fIds.slice(i, i + 100)
        const { data: toDel } = await sbAdmin.from('lancamentos_contabeis').select('id').in('origem_id', chunk)
        if (toDel && toDel.length > 0) {
           const delIds = toDel.map(d => d.id)
           await sbAdmin.from('lancamentos_partidas').delete().in('lancamento_id', delIds)
           await sbAdmin.from('lancamentos_contabeis').delete().in('id', delIds)
        }
     }
  }

  const nomesCache: Record<string, string> = {}

  // Iteramos sobre a lista já ORDENADA por data
  for (const lf of allLancsFin) {
    // Busca nome da entidade vinculada
    let nomeEntidade = ''
    const entidadeId = lf.associado_id || lf.fornecedor_id
    if (entidadeId) {
      if (nomesCache[entidadeId]) {
        nomeEntidade = nomesCache[entidadeId]
      } else {
        const tabela = lf.associado_id ? 'associados' : 'fornecedores'
        const { data: ent } = await sbAdmin.from(tabela).select('nome').eq('id', entidadeId).maybeSingle()
        if (ent?.nome) {
          nomeEntidade = ent.nome
          nomesCache[entidadeId] = ent.nome
        }
      }
    }

    const categoria = (lf.categoria || '').toUpperCase()
    let newDescricao = lf.descricao

    // --- LÓGICA DE LIMPEZA AGRESSIVA DE HISTÓRICO ---
    let descLimpa = (lf.descricao || '')
      .replace(/Pgto QR Code Pix - /gi, '')
      .replace(/Transf Pix enviada - /gi, '')
      .replace(/Pagamento recebido - /gi, '')
      .replace(/Transf Pix recebida - /gi, '')
      .replace(/(PAGAMENTO\s*-\s*)+/gi, '')
      .replace(/(PAGAMENTO\s+A\s+)+/gi, '')
      .replace(/PAGAMENTO/gi, '')
      .replace(/PAG - /gi, '')
      .replace(/REC - /gi, '')
      .replace(/Débito em conta - /gi, '')
      .replace(/TARIFAS BANCÁRIAS/gi, '')
      .replace(/MENSALIDADE DE ASSOCIADO/gi, '')
      .replace(/ADESÃO DE ASSOCIADO/gi, '')
      .replace(/ - - /g, ' - ')
      .replace(/  +/g, ' ')
      .trim()
      .replace(/^- /, '')
      .replace(/- $/g, '')

    if (categoria.includes('MENSALIDADE') || categoria.includes('ADESÃO')) {
      const prefixo = categoria.includes('ADESÃO') ? 'ADESÃO' : 'MENSALIDADE'
      newDescricao = `${prefixo} DE ASSOCIADO - ${nomeEntidade || descLimpa || 'ASSOCIADO'}`
    } else if (categoria.includes('ALUGUEL')) {
      newDescricao = `ALUGUEL - ${nomeEntidade || 'JOSE BARBOSA DOS ANJOS'}`
    } else if (categoria.includes('TARIFA') || categoria.includes('TAXA')) {
      newDescricao = `TARIFAS BANCÁRIAS - ${descLimpa || lf.categoria}`
    } else if (lf.tipo === 'despesa') {
      newDescricao = nomeEntidade ? `PAGAMENTO - ${nomeEntidade} - ${lf.categoria}` : `PAGAMENTO - ${descLimpa || lf.categoria}`
    }

    try {
      // 1. Atualiza no financeiro
      if (newDescricao !== lf.descricao) {
        await sbAdmin.from('lancamentos').update({ descricao: newDescricao }).eq('id', lf.id)
        renamedCount++
      }

      // 2. Re-sincroniza (Terreno já limpo, garantindo sequência correta)
      const res = await sincronizarLancamentoContabil(lf.id, undefined, sbAdmin)
      if (res.success) fixedCount++
      else errorCount++
    } catch (e: any) {
      console.error(`Erro no item ${lf.id}:`, e.message)
      errorCount++
    }
  }

  // 4. Registrar no log
  await sbAdmin.from('contabil_logs').insert({
    tenant_id: tenantId,
    acao: 'SANEAMENTO HISTÓRICO',
    detalhes: `Saneamento concluído. Reprocessados: ${fixedCount}. Renomeados (Jan-Abr): ${renamedCount}. Falhas: ${errorCount}.`
  })

  return { success: true, fixedCount, errorCount, renamedCount }
}
