'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { parseNFSeXML } from '../utils/nfseParser'
import { createClient } from '@supabase/supabase-js'

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Server Action para importar e processar XML de NFS-e
 */
export async function importarNFSeAction(xmlContent: string, clientTenantId?: string) {
  const sb = await createServerSupabase()
  const sbAdmin = createAdminSupabase()
  
  try {
    const parsed = parseNFSeXML(xmlContent)
    
    // Pega o tenant do usuário logado
    const { data: { user } } = await sb.auth.getUser()
    
    const fallbackId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
    let tenantId = clientTenantId || fallbackId
    
    // Prioriza descobrir o tenant real via sessão do servidor
    if (tenantId === fallbackId || !clientTenantId) {
      if (user) {
        // 1. JWT Metadata
        const metaTenant = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
        if (metaTenant) {
          tenantId = metaTenant
        } else {
          // 2. Database Fallback
          const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
          if (userData?.tenant_id) tenantId = userData.tenant_id
        }
      }
    }

    // 1. Identificar/Criar Prestador (Garante fornecedor e conta contábil)
    const prestador = await garantirFornecedorAction({
      cnpj: parsed.prestador.cnpj,
      razaoSocial: parsed.prestador.razao_social,
      tenantId
    })
    if (prestador.error) throw new Error(prestador.error)

    // 2. Persistir no Banco de Dados - Padrão FIND → CLAIM → INSERT
    let nfseId: string | undefined;

    // STEP 1: Busca global por chave_nacional (ignora tenant - RLS bypass via admin)
    if (parsed.nota.chave_nacional) {
      const { data: found } = await sbAdmin
        .from('nfse_entradas')
        .select('id, tenant_id')
        .eq('chave_nacional', parsed.nota.chave_nacional)
        .limit(1)
        .maybeSingle()
      
      if (found) {
        // CLAIM: Transfere para o tenant atual independente de onde estava
        await sbAdmin
          .from('nfse_entradas')
          .update({ tenant_id: tenantId, prestador_id: prestador.id })
          .eq('id', found.id)
        nfseId = found.id
      }
    }
    
    // STEP 2: Busca global por número + CNPJ prestador (para ABRASF sem chave)
    if (!nfseId) {
      const cnpjLimpo = parsed.prestador.cnpj.replace(/\D/g, '')
      const { data: foundAbrasf } = await sbAdmin
        .from('nfse_entradas')
        .select('id, tenant_id')
        .eq('numero_nfse', parsed.nota.numero_nfse)
        .limit(1)
        .maybeSingle()
      
      if (foundAbrasf) {
        await sbAdmin
          .from('nfse_entradas')
          .update({ tenant_id: tenantId, prestador_id: prestador.id })
          .eq('id', foundAbrasf.id)
        nfseId = foundAbrasf.id
      }
    }

    // STEP 3: Se realmente não existe, insere
    if (!nfseId) {
      const payload: any = {
        tenant_id: tenantId,
        prestador_id: prestador.id,
        numero_nfse: parsed.nota.numero_nfse,
        data_emissao: parsed.nota.data_emissao,
        data_competencia: parsed.nota.data_competencia || parsed.nota.data_emissao,
        valor_bruto: parsed.nota.valor_bruto,
        valor_liquido: parsed.nota.valor_liquido,
        valor_irrf: parsed.nota.valor_irrf,
        valor_pis: parsed.nota.valor_pis,
        valor_cofins: parsed.nota.valor_cofins,
        valor_csll: parsed.nota.valor_csll,
        valor_iss: parsed.nota.valor_iss,
        iss_retido: parsed.nota.iss_retido,
        descricao_servico: parsed.nota.descricao_servico,
        codigo_servico_lc116: parsed.nota.codigo_servico_lc116,
        situacao: 'autorizada',
        status_escrituracao: 'pendente'
      }
      // Só inclui chave_nacional se existir (evita duplicidade no campo único)
      if (parsed.nota.chave_nacional) payload.chave_nacional = parsed.nota.chave_nacional
      
      const { data: nova, error: insertErr } = await sbAdmin
        .from('nfse_entradas')
        .insert(payload)
        .select('id')
        .single()

      if (insertErr) {
        // Fallback final: Tenta buscar por qualquer campo possível
        if (insertErr.code === '23505') {
          const { data: lastChance } = await sbAdmin
            .from('nfse_entradas')
            .select('id')
            .or(parsed.nota.chave_nacional 
              ? `chave_nacional.eq.${parsed.nota.chave_nacional}`
              : `numero_nfse.eq.${parsed.nota.numero_nfse}`)
            .limit(1)
            .maybeSingle()
          
          if (lastChance) {
            await sbAdmin.from('nfse_entradas')
              .update({ tenant_id: tenantId, prestador_id: prestador.id })
              .eq('id', lastChance.id)
            nfseId = lastChance.id
          }
        }
        if (!nfseId) throw new Error(`Erro ao salvar nota: ${insertErr.message}`)
      } else {
        nfseId = nova.id
      }
    }

    return { 
      success: true, 
      data: {
        ...parsed,
        nota: {
          ...parsed.nota,
          id: nfseId,
          prestador_id: prestador.id
        }
      } 
    }
  } catch (err: any) {
    return { error: err.message || 'Erro ao processar XML' }
  }
}

/**
 * Garante que um fornecedor/prestador exista no sistema.
 * Se não existir, cria o fornecedor e gera automaticamente sua conta contábil (ITG 2002).
 */
export async function garantirFornecedorAction(params: {
  cnpj: string;
  razaoSocial: string;
  tenantId: string;
  isPrestador?: boolean;
}) {
  const { cnpj, razaoSocial, tenantId, isPrestador = true } = params
  const sbAdmin = createAdminSupabase()
  const cleanedCnpj = cnpj.replace(/\D/g, '')

  // 1. Buscar existente
  const { data: existente } = await sbAdmin
    .from('fornecedores')
    .select('id, nome, conta_contabil_id, is_prestador_servicos')
    .eq('tenant_id', tenantId)
    .eq('cpf_cnpj', cleanedCnpj)
    .maybeSingle()

  if (existente) {
    // Se existe mas não estava marcado como prestador, atualiza
    if (isPrestador && !existente.is_prestador_servicos) {
      await sbAdmin.from('fornecedores').update({ is_prestador_servicos: true }).eq('id', existente.id)
    }
    return { id: existente.id, data: existente }
  }

  // 2. Criar novo Fornecedor com Conta Contábil automática
  console.log(`Auto-cadastrando fornecedor: ${razaoSocial} para o tenant ${tenantId}`)
  
  let contaContabilId = null
  try {
    // Lógica para gerar código sequencial no grupo 2.1.3.01 (Fornecedores Nacionais)
    const { data: ultimasContas } = await sbAdmin.from('plano_contas')
      .select('codigo')
      .eq('tenant_id', tenantId)
      .like('codigo', '2.1.3.01.%')
      .order('codigo', { ascending: false })
      .limit(1)

    let novoCodigo = '2.1.3.01.100'
    if (ultimasContas && ultimasContas.length > 0) {
      const ultimo = ultimasContas[0].codigo
      const partes = ultimo.split('.')
      const sequencial = parseInt(partes[partes.length - 1], 10)
      if (!isNaN(sequencial) && sequencial >= 100) {
        novoCodigo = `2.1.3.01.${String(sequencial + 1).padStart(3, '0')}`
      }
    }

    const { data: pai } = await sbAdmin.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', '2.1.3.01').single()

    const { data: novaConta } = await sbAdmin.from('plano_contas').insert({
      tenant_id: tenantId,
      codigo: novoCodigo,
      descricao: `Fornecedor: ${razaoSocial}`,
      nivel: 5,
      tipo: 'analitica',
      natureza: 'credora',
      classificacao: 'passivo',
      aceita_lancamentos: true,
      ativa: true,
      conta_pai_id: pai?.id || null
    }).select('id').single()

    if (novaConta) contaContabilId = novaConta.id
  } catch (err) {
    console.error('Erro ao auto-gerar conta do fornecedor:', err)
  }

  const { data: novo, error: insErr } = await sbAdmin
    .from('fornecedores')
    .insert({
      tenant_id: tenantId,
      nome: razaoSocial,
      cpf_cnpj: cleanedCnpj,
      is_prestador_servicos: isPrestador,
      status: 'ativo',
      conta_contabil_id: contaContabilId
    })
    .select('*')
    .single()

  if (insErr) return { error: `Erro ao criar fornecedor: ${insErr.message}` }
  return { id: novo.id, data: novo }
}

/**
 * Busca um fornecedor/prestador pelo CPF ou CNPJ
 */
export async function getFornecedorByCpfCnpjAction(cpfCnpj: string) {
  const sb = await createServerSupabase()
  // Limpar formatação
  const clean = cpfCnpj.replace(/\D/g, '')
  const { data, error } = await sb.from('fornecedores')
    .select('id, nome, cpf_cnpj')
    .or(`cpf_cnpj.eq.${clean},cpf_cnpj.eq.${cpfCnpj}`)
    .maybeSingle()
  return { data, error: error?.message }
}

/**
 * Busca lançamentos financeiros candidatos a vínculo com uma NFS-e
 */
export async function buscarLancamentosParaVinculoAction(prestadorId: string, periodo?: string, ignoreFornecedor = false) {
  const sb = await createServerSupabase()
  
  let query = sb.from('lancamentos')
    .select('*')
    .eq('tipo', 'despesa')

  if (!ignoreFornecedor) {
    // 1. Buscar o prestador para ter o CNPJ e Nome
    const { data: prestador } = await sb.from('fornecedores').select('nome, cpf_cnpj').eq('id', prestadorId).single()
    const nomeLimpo = prestador?.nome?.split(' ')[0] || ''
    const cnpjLimpo = prestador?.cpf_cnpj?.replace(/\D/g, '') || ''

    // Busca por fornecedor_id OU por texto na descrição (Fuzzy)
    const orFilter = [`fornecedor_id.eq.${prestadorId}`]
    if (nomeLimpo && nomeLimpo.length > 2) orFilter.push(`descricao.ilike.%${nomeLimpo}%`)
    if (cnpjLimpo && cnpjLimpo.length > 5) orFilter.push(`descricao.ilike.%${cnpjLimpo}%`)
    
    query = query.or(orFilter.join(','))
  }

  if (periodo && periodo !== 'all') {
    query = query.gte('data', `${periodo}-01`).lte('data', `${periodo}-31`)
  }

  const { data, error } = await query.order('data', { ascending: false }).limit(100)
  return { data: data || [], error: error?.message }
}

/**
 * Server Action para salvar a escrituração de uma NFS-e vinculando a um financeiro existente
 */
export async function salvarEscrituracaoNFSeAction(payload: { 
  nfseId: string; 
  financeiroId: string;
  dataEfetiva?: string;
}) {
  const sb = await createServerSupabase()
  const sbAdmin = createAdminSupabase()
  const { nfseId, financeiroId, dataEfetiva } = payload

  try {
    // 1. Buscar a nota original
    const { data: nfse, error: fetchErr } = await sbAdmin
      .from('nfse_entradas')
      .select('*, prestador:fornecedores(*)')
      .eq('id', nfseId)
      .single()

    if (fetchErr || !nfse) throw new Error('NFS-e não encontrada')

    // 2. Buscar o lançamento financeiro
    const { data: fin, error: finErr } = await sb
      .from('lancamentos')
      .select('*')
      .eq('id', financeiroId)
      .single()

    if (finErr || !fin) throw new Error('Lançamento financeiro não encontrado')

    // 3. Criar Vínculo
    await sbAdmin.from('nfse_financeiro_vinculo').insert({
      tenant_id: nfse.tenant_id,
      nfse_id: nfse.id,
      financeiro_id: fin.id,
      tipo_vinculo: 'escrituracao_vinculo'
    })

    // 4. Marcar nota como concluída e vincular ao financeiro (Usando ADMIN para garantir sucesso)
    const updatePayload: any = { status_escrituracao: 'concluida' }
    if (dataEfetiva) updatePayload.data_competencia = dataEfetiva

    const { error: upErr } = await sbAdmin.from('nfse_entradas').update(updatePayload).eq('id', nfse.id)

    if (upErr) throw new Error(`Erro ao atualizar status da nota: ${upErr.message}`)

    // 5. Re-sincronizar Contabilidade
    // Sincroniza a Provisão da Nota e a Liquidação do Financeiro
    const { sincronizarLancamentoContabil, sincronizarNotaFiscalContabil } = await import('@/features/contabil/actions/accountingActions')
    
    await sincronizarNotaFiscalContabil(nfseId, 'nfse')
    const resSync = await sincronizarLancamentoContabil(financeiroId)

    // 6. Atualizar o lançamento contábil com o número do documento (NFS-e)
    const { data: lancContabil } = await sbAdmin
      .from('lancamentos_contabeis')
      .select('id')
      .eq('origem_id', financeiroId)
      .maybeSingle()
    
    if (lancContabil) {
      await sbAdmin.from('lancamentos_contabeis').update({
        documento_tipo: 'NF',
        documento_numero: nfse.numero_nfse,
        origem_tipo: 'fiscal_nfse'
      }).eq('id', lancContabil.id)

      // Também salvar o ID do lançamento contábil na nota para referência rápida
      await sbAdmin.from('nfse_entradas').update({ 
        lancamento_contabil_id: lancContabil.id 
      }).eq('id', nfseId)
    }

    return { success: true, syncError: resSync.error }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Vincula uma NFS-e existente a um lançamento financeiro já existente
 */
export async function vincularNFSeALancamentoAction(nfseId: string, lancamentoId: string) {
  const sb = await createServerSupabase()

  try {
    // 1. Buscar dados
    const sbAdmin = createAdminSupabase()
    const { data: nfse } = await sbAdmin.from('nfse_entradas').select('*').eq('id', nfseId).single()
    const { data: lanc } = await sbAdmin.from('lancamentos').select('*').eq('id', lancamentoId).single()

    if (!nfse || !lanc) throw new Error('NFS-e ou Lançamento não encontrado')

    // 2. Criar Vínculo
    const { error: vinculoErr } = await sbAdmin.from('nfse_financeiro_vinculo').insert({
      tenant_id: lanc.tenant_id,
      nfse_id: nfseId,
      financeiro_id: lancamentoId,
      tipo_vinculo: 'vinculo_manual',
      data_vinculo: new Date().toISOString()
    })

    if (vinculoErr) throw new Error(`Erro ao criar vínculo: ${vinculoErr.message}`)

    // 3. Atualizar Status da Nota
    await sbAdmin.from('nfse_entradas').update({
      status_escrituracao: 'concluida'
    }).eq('id', nfseId)

    // 4. Re-integrar com Contabilidade
    const { sincronizarLancamentoContabil } = await import('@/features/contabil/actions/accountingActions')
    await sincronizarLancamentoContabil(lancamentoId)

    // 5. Atualizar Lançamento Contábil com o Documento
    const { data: lancContabil } = await sbAdmin.from('lancamentos_contabeis').select('id').eq('origem_id', lancamentoId).maybeSingle()
    if (lancContabil) {
      await sbAdmin.from('lancamentos_contabeis').update({
        documento_tipo: 'NF',
        documento_numero: nfse.numero_nfse,
        origem_tipo: 'fiscal_nfse'
      }).eq('id', lancContabil.id)

      await sbAdmin.from('nfse_entradas').update({ lancamento_contabil_id: lancContabil.id }).eq('id', nfseId)
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Server Action para buscar a lista de NFS-e ignorando bloqueios de RLS de leitura
 */
export async function getNFSeListAction(tenantIdParam?: string, periodo?: string) {
  const sbAdmin = createAdminSupabase()
  const tenantId = tenantIdParam || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  let q = sbAdmin
    .from('nfse_entradas')
    .select('*')
    .eq('tenant_id', tenantId)

  if (periodo && periodo !== 'all') {
    const [year, month] = periodo.split('-')
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const startDate = `${year}-${month}-01 00:00:00`
    const endDate = `${year}-${month}-${lastDay} 23:59:59`
    q = q.gte('data_emissao', startDate).lte('data_emissao', endDate)
  }

  const { data, error } = await q.order('data_emissao', { ascending: false })

  if (error) {
    console.error('getNFSeListAction Error:', error.message)
    return { error: error.message, data: null }
  }

  // Fetch prestadores separately to avoid PostgREST relationship errors
  let enrichedData = data;
  if (data && data.length > 0) {
    const prestadorIds = [...new Set(data.map(n => n.prestador_id).filter(Boolean))];
    if (prestadorIds.length > 0) {
      const { data: prestadores } = await sbAdmin
        .from('fornecedores')
        .select('id, nome, cpf_cnpj')
        .in('id', prestadorIds);
        
      if (prestadores) {
        const prestadorMap = Object.fromEntries(prestadores.map(p => [p.id, p]));
        enrichedData = data.map(n => ({
          ...n,
          prestador: prestadorMap[n.prestador_id] || null
        }));
      }
    }
  }

  return { error: null, data: enrichedData }
}


/**
 * Exclui uma ou mais NFS-e por ID (requer senha validada no cliente)
 */
export async function deletarNFSeAction(ids: string[]) {
  if (!ids || ids.length === 0) return { success: false, error: 'Nenhuma nota selecionada' }
  
  const sbAdmin = createAdminSupabase()
  
  // Primeiro remove vínculos financeiros e contábeis relacionados
  await sbAdmin.from('nfse_financeiro_vinculo').delete().in('nfse_id', ids)
  
  // Depois exclui as notas
  const { error } = await sbAdmin
    .from('nfse_entradas')
    .delete()
    .in('id', ids)

  if (error) return { success: false, error: error.message }
  return { success: true, count: ids.length }
}
/**
 * Vincula uma NF-e (Produto) existente a um lançamento financeiro
 */
export async function vincularNFeALancamentoAction(nfeId: string, lancamentoId: string) {
  const sb = await createServerSupabase()

  try {
    const sbAdmin = createAdminSupabase()
    const { data: nfe } = await sbAdmin.from('nfe_entradas').select('*').eq('id', nfeId).single()
    const { data: lanc } = await sbAdmin.from('lancamentos').select('*').eq('id', lancamentoId).single()

    if (!nfe || !lanc) {
      console.error('Link Error - IDs not found:', { nfeId, lancamentoId, nfeFound: !!nfe, lancFound: !!lanc })
      throw new Error('NF-e ou Lançamento não encontrado')
    }

    // 1. Criar Vínculo na tabela de junção
    await sbAdmin.from('nfse_financeiro_vinculo').insert({
      tenant_id: lanc.tenant_id,
      nfe_id: nfeId,
      financeiro_id: lancamentoId,
      tipo_vinculo: 'vinculo_manual',
      data_vinculo: new Date().toISOString()
    })

    // 2. Atualizar NFe
    await sbAdmin.from('nfe_entradas').update({
      status_escrituracao: 'concluida',
      financeiro_lancamento_id: lancamentoId
    }).eq('id', nfeId)

    // 3. Integrar Contabilidade
    const { sincronizarLancamentoContabil, sincronizarNotaFiscalContabil } = await import('@/features/contabil/actions/accountingActions')
    
    await sincronizarNotaFiscalContabil(nfeId, 'nfe')
    await sincronizarLancamentoContabil(lancamentoId)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
