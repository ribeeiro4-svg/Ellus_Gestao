'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { parseNFSeXML } from '../utils/nfseParser'

/**
 * Server Action para importar e processar XML de NFS-e
 */
export async function importarNFSeAction(xmlContent: string) {
  const sb = await createServerSupabase()
  
  try {
    const parsed = parseNFSeXML(xmlContent)
    
    // Pega o tenant do usuário logado
    const { data: { user } } = await sb.auth.getUser()
    let tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
    if (user) {
      const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
      if (userData?.tenant_id) tenantId = userData.tenant_id
    }

    // 1. Identificar/Criar Prestador
    const prestador = await identificarPrestadorAction(parsed.prestador.cnpj, parsed.prestador.razao_social, tenantId)
    if (prestador.error) throw new Error(prestador.error)

    // 2. Preparar Nota para Revisão (Ainda não salva no banco, retorna para a UI)
    return { 
      success: true, 
      data: {
        ...parsed,
        nota: {
          ...parsed.nota,
          prestador_id: prestador.id
        }
      } 
    }
  } catch (err: any) {
    return { error: err.message || 'Erro ao processar XML' }
  }
}

/**
 * Busca ou cria um prestador baseado no CNPJ
 */
export async function identificarPrestadorAction(cnpj: string, razaoSocial: string, tenantId: string) {
  const sb = await createServerSupabase()
  const cleanedCnpj = cnpj.replace(/\D/g, '')

  // 1. Buscar existente
  const { data: existente, error: findErr } = await sb
    .from('fornecedores')
    .select('id, is_prestador_servicos')
    .eq('cpf_cnpj', cleanedCnpj)
    .maybeSingle()

  if (existente) {
    // Se existe mas não era marcado como prestador, atualiza flag
    if (!existente.is_prestador_servicos) {
      await sb.from('fornecedores').update({ is_prestador_servicos: true }).eq('id', existente.id)
    }
    return { id: existente.id }
  }

  // 2. Criar novo (Utiliza o hook useFornecedores indiretamente via API do Supabase)
  // Nota: Idealmente usaríamos a mesma lógica de auto-geração de conta contábil
  const { data: novo, error: insErr } = await sb
    .from('fornecedores')
    .insert({
      tenant_id: tenantId,
      nome: razaoSocial,
      cpf_cnpj: cleanedCnpj,
      is_prestador_servicos: true,
      status: 'ativo'
    })
    .select('id')
    .single()

  if (insErr) return { error: `Erro ao criar prestador: ${insErr.message}` }
  return { id: novo.id }
}

/**
 * Server Action para salvar a escrituração de uma NFS-e
 * Fluxo A: Escrituração -> Financeiro + Contábil
 */
export async function salvarEscrituracaoNFSeAction(payload: any) {
  const sb = await createServerSupabase()
  const { id, conta_despesa_id, centro_custo_id, projeto_id } = payload

  try {
    // 1. Buscar a nota original
    const { data: nfse, error: fetchErr } = await sb
      .from('nfse_entradas')
      .select('*, prestador:fornecedores(*)')
      .eq('id', id)
      .single()

    if (fetchErr || !nfse) throw new Error('NFS-e não encontrada')

    // 2. Verificar período contábil
    const { isPeriodoFechado } = await import('@/features/contabil/actions/periodoActions')
    const fechado = await isPeriodoFechado(nfse.data_emissao, nfse.tenant_id)
    if (fechado) throw new Error('Período contábil FECHADO para esta data.')

    // --- INÍCIO DA TRANSAÇÃO (Via Promise.all ou lógica sequencial se não houver suporte a transações complexas via RPC) ---
    // Nota: Como não temos um endpoint de RPC para transações multi-tabela complexas aqui, 
    // faremos de forma sequencial com rollback manual se necessário, ou assumindo atomicidade do Supabase em operações únicas.

    // 3. Criar Lançamento Financeiro (Título a Pagar - Valor Líquido)
    const { data: fin, error: finErr } = await sb
      .from('lancamentos')
      .insert({
        tenant_id: nfse.tenant_id,
        data: nfse.data_emissao,
        descricao: `NFS-e ${nfse.numero_nfse} — ${nfse.prestador?.nome}`,
        categoria: 'Serviços de Terceiros',
        tipo: 'despesa',
        valor: nfse.valor_liquido,
        status: 'aberto',
        fornecedor_id: nfse.prestador_id
      })
      .select('id')
      .single()

    if (finErr) throw new Error(`Erro ao criar financeiro: ${finErr.message}`)

    // 4. Criar Vínculo Bidirecional
    await sb.from('nfse_financeiro_vinculo').insert({
      tenant_id: nfse.tenant_id,
      nfse_id: nfse.id,
      financeiro_id: fin.id,
      tipo_vinculo: 'escrituracao_direta'
    })

    // 5. Gerar Lançamento Contábil (ITG 2002)
    // D: Despesa (conta_despesa_id)
    // C: Fornecedores a Pagar (2.1.3.01.002)
    const { data: contaPassivo } = await sb.from('plano_contas').select('id').eq('tenant_id', nfse.tenant_id).eq('codigo', '2.1.3.01.002').maybeSingle()
    
    const { count } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', nfse.tenant_id)
    const seq = ((count || 0) + 1).toString().padStart(6, '0')
    const numeroContabil = `${nfse.data_emissao.slice(0, 4)}/${seq}`

    const { data: lancContabil, error: lcErr } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: nfse.tenant_id,
      numero_lancamento: numeroContabil,
      data_lancamento: nfse.data_emissao,
      data_competencia: nfse.data_competencia || nfse.data_emissao,
      tipo: 'normal',
      historico: `Escrituração NFS-e ${nfse.numero_nfse} — ${nfse.prestador?.nome}`,
      origem_tipo: 'fiscal_nfse',
      origem_id: nfse.id,
      status: 'confirmado'
    }).select('id').single()

    if (!lcErr && lancContabil && contaPassivo) {
      await sb.from('lancamentos_partidas').insert([
        { lancamento_id: lancContabil.id, conta_id: conta_despesa_id, tipo_partida: 'D', valor: nfse.valor_bruto, ordem: 1, historico_partida: 'Vlr. ref. serviço tomado' },
        { lancamento_id: lancContabil.id, conta_id: contaPassivo.id, tipo_partida: 'C', valor: nfse.valor_liquido, ordem: 2, historico_partida: 'Vlr. líquido a pagar' },
        // Lógica simplificada: Impostos retidos iriam aqui como Crédito em contas de Passivo
      ])
    }

    // 6. Atualizar Nota como Concluída
    await sb.from('nfse_entradas').update({
      status_escrituracao: 'concluida',
      conta_despesa_id,
      centro_custo_id,
      projeto_id,
      lancamento_contabil_id: lancContabil?.id
    }).eq('id', id)

    return { success: true, createdCount: 1, error: null }
  } catch (err: any) {
    return { error: err.message || 'Erro ao finalizar escrituração' }
  }
}

/**
 * Vincula uma NFS-e existente a um lançamento financeiro já existente
 */
export async function vincularNFSeALancamentoAction(nfseId: string, lancamentoId: string) {
  const sb = await createServerSupabase()

  try {
    // 1. Buscar dados
    const { data: nfse } = await sb.from('nfse_entradas').select('*').eq('id', nfseId).single()
    const { data: lanc } = await sb.from('lancamentos').select('*').eq('id', lancamentoId).single()

    if (!nfse || !lanc) throw new Error('NFS-e ou Lançamento não encontrado')

    // 2. Criar Vínculo
    const { error: vinculoErr } = await sb.from('nfse_financeiro_vinculo').insert({
      tenant_id: lanc.tenant_id,
      nfse_id: nfseId,
      financeiro_id: lancamentoId,
      tipo_vinculo: 'vinculo_manual',
      data_vinculo: new Date().toISOString()
    })

    if (vinculoErr) throw new Error(`Erro ao criar vínculo: ${vinculoErr.message}`)

    // 3. Atualizar Status da Nota
    await sb.from('nfse_entradas').update({
      status_escrituracao: 'concluida'
    }).eq('id', nfseId)

    // 4. Re-integrar com Contabilidade
    const { sincronizarLancamentoContabil } = await import('@/features/contabil/actions/accountingActions')
    await sincronizarLancamentoContabil(lancamentoId)

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
