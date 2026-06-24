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
 * Busca candidatos (Financeiro e Notas Fiscais) para vincular a um lançamento contábil
 */
export async function buscarCandidatosVincularAction(lancamentoId: string) {
  const sb = await createServerSupabase()
  const sbAdmin = createAdminSupabase()
  
  // 1. Buscar o lançamento contábil
  const { data: lanc, error: lancErr } = await sb
    .from('lancamentos_contabeis')
    .select('*')
    .eq('id', lancamentoId)
    .single()
  
  if (lancErr || !lanc) return { error: 'Lançamento contábil não encontrado' }

  // 2. Extrair múltiplos termos de busca do histórico para busca agressiva
  const historico = lanc.historico || ''
  const partes = historico.split(/[\s—\-]+/).filter((p: string) => p.length > 2 && !['PAG', 'REC', 'Ref', 'TRANSF', 'PIX', 'ENVIADA', 'RECEBIDA'].includes(p.toUpperCase()))
  
  // CNPJ limpo (apenas dígitos) se houver algo que pareça um CNPJ
  const cnpjMatch = historico.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
  const cnpjLimpo = cnpjMatch ? cnpjMatch[0].replace(/\D/g, '') : null
  
  const termoPrincipal = partes[partes.length - 1] || ''

  // 3. Buscar no Financeiro (lancamentos)
  // Filtra por valor aproximado ou termo na descrição
  const { data: financial } = await sb
    .from('lancamentos')
    .select('id, data, descricao, categoria, valor, tipo')
    .or(`descricao.ilike.%${termoPrincipal}%,categoria.ilike.%${termoPrincipal}%`)
    .limit(10)

  // 4. Buscar em NFS-e
  // 4a. Busca direta por vínculo financeiro (mais preciso)
  let nfsePorVinculo: any[] = []
  if (lanc.origem_tipo === 'financeiro' && lanc.origem_id) {
    const { data: vinculos } = await sbAdmin
      .from('nfse_financeiro_vinculo')
      .select('nfse:nfse_id(id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome))')
      .eq('financeiro_id', lanc.origem_id)
    
    if (vinculos) {
      nfsePorVinculo = vinculos.map((v: any) => v.nfse).filter(Boolean)
    }
  }

  // 4b. Busca por Prestadores (Nome ou CNPJ) - USANDO ADMIN PARA BYPASS RLS
  let prestadorIds: string[] = []
  const { data: prestadoresMatch } = await sbAdmin
    .from('fornecedores')
    .select('id')
    .or(`nome.ilike.%${termoPrincipal}%,cpf_cnpj.ilike.%${cnpjLimpo || termoPrincipal}%`)
  
  if (prestadoresMatch) prestadorIds = prestadoresMatch.map((p: any) => p.id)

  // Adiciona prestadores por fragmentos do nome
  if (partes.length > 0) {
    const { data: prestadoresFragmentos } = await sbAdmin
      .from('fornecedores')
      .select('id')
      .or(partes.map((p: string) => `nome.ilike.%${p}%`).join(','))
    if (prestadoresFragmentos) {
      prestadorIds = [...new Set([...prestadorIds, ...prestadoresFragmentos.map((p: any) => p.id)])]
    }
  }

  // 4c. Busca as Notas dos Prestadores encontrados + busca por número da nota - USANDO ADMIN
  const { data: nfsePorBusca } = await sbAdmin
    .from('nfse_entradas')
    .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
    .or(`numero_nfse.ilike.%${termoPrincipal}%,prestador_id.in.(${prestadorIds.length > 0 ? prestadorIds.map(id => `"${id}"`).join(',') : '"00000000-0000-0000-0000-000000000000"' })`)
    .limit(20)

  const nfseMap = new Map();
  [...nfsePorVinculo, ...(nfsePorBusca || [])].forEach((n: any) => nfseMap.set(n.id, n));
  
  // 4d. Fallback: Se não achou nada, busca notas recentes do mesmo mês - USANDO ADMIN
  if (nfseMap.size === 0) {
    const mes = lanc.data_lancamento.slice(0, 7)
    const { data: recentNfse } = await sbAdmin
      .from('nfse_entradas')
      .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
      .gte('data_emissao', `${mes}-01`)
      .lte('data_emissao', `${mes}-31`)
      .limit(5)
    if (recentNfse) recentNfse.forEach((n: any) => nfseMap.set(n.id, n))
  }

  const nfseBase = Array.from(nfseMap.values())

  // Adicionar info de vínculo financeiro para o modal - USANDO ADMIN
  const nfseIds = nfseBase.map((n: any) => n.id)
  const { data: vinculosExistentes } = await sbAdmin.from('nfse_financeiro_vinculo').select('nfse_id, financeiro_id').in('nfse_id', nfseIds)
  
  const nfse = nfseBase.map((n: any) => ({
    ...n,
    financeiro_vinculado_id: vinculosExistentes?.find((v: any) => v.nfse_id === n.id)?.financeiro_id || null
  }))

  // 5. Buscar em NF-e (Produtos) - USANDO ADMIN
  // 5a. Busca direta por vínculo financeiro (mais preciso)
  let nfePorVinculo: any[] = []
  if (lanc.origem_tipo === 'financeiro' && lanc.origem_id) {
    const { data: nfeV } = await sbAdmin
      .from('nfe_entradas')
      .select('id, numero_nf, data_emissao, valor_total, nome_emitente')
      .eq('lancamento_financeiro_id', lanc.origem_id)
    if (nfeV) nfePorVinculo = nfeV
  }

  const { data: nfePorTermo } = await sbAdmin
    .from('nfe_entradas')
    .select('id, numero_nf, data_emissao, valor_total, nome_emitente')
    .or(`numero_nf.ilike.%${termoPrincipal}%,nome_emitente.ilike.%${termoPrincipal}%`)
    .limit(10)

  const nfeMap = new Map();
  [...nfePorVinculo, ...(nfePorTermo || [])].forEach((n: any) => nfeMap.set(n.id, n));
  const nfe = Array.from(nfeMap.values())

  return {
    success: true,
    data: {
      financial: financial || [],
      nfse: [...nfse].slice(0, 10),
      nfe: nfe.slice(0, 10)
    }
  }
}

/**
 * Vincula o lançamento contábil a um documento e reprocessa a integração
 */
export async function vincularEDocumentoReprocessarAction(params: {
  lancamentoId: string,
  docType: 'financeiro' | 'nfse' | 'nfe',
  docId: string,
  financialId?: string // Opcional: Para vincular nota ao financeiro simultaneamente
}) {
  const sb = await createServerSupabase()
  const { lancamentoId, docType, docId, financialId } = params

  try {
    // 1. Buscar dados dos envolvidos
    const { data: lanc } = await sb.from('lancamentos_contabeis').select('*').eq('id', lancamentoId).single()
    if (!lanc) throw new Error('Lançamento contábil não encontrado')

    // 1.1 Se houver financialId fornecido, criar o vínculo fiscal <-> financeiro primeiro
    if (docType === 'nfse' && financialId) {
      const { vincularNFSeALancamentoAction } = await import('../../fiscal/actions/nfseActions')
      await vincularNFSeALancamentoAction(docId, financialId)
    }

    let docNumero = ''
    let docTipo = ''
    let origemTipo = ''

    if (docType === 'nfse') {
      const sbAdmin = createAdminSupabase()
      const { data: nfse } = await sbAdmin.from('nfse_entradas').select('numero_nfse').eq('id', docId).single()
      docNumero = nfse?.numero_nfse || ''
      docTipo = 'NF'
      origemTipo = 'fiscal_nfse'
      // Marcar nota como vinculada/escriturada
      await sbAdmin.from('nfse_entradas').update({ status_escrituracao: 'concluida', lancamento_contabil_id: lancamentoId }).eq('id', docId)
    } else if (docType === 'nfe') {
      const { data: nfe } = await sb.from('nfe_entradas').select('numero_nf').eq('id', docId).single()
      docNumero = nfe?.numero_nf || ''
      docTipo = 'NF'
      origemTipo = 'fiscal_nfe'
      await sb.from('nfe_entradas').update({ status_escrituracao: 'concluida', lancamento_contabil_id: lancamentoId }).eq('id', docId)
    } else if (docType === 'financeiro') {
      const { data: fin } = await sb.from('lancamentos').select('descricao').eq('id', docId).single()
      docNumero = ''
      docTipo = 'FIN'
      origemTipo = 'financeiro'
    }

    // 2. Atualizar o lançamento contábil
    // IMPORTANTE: Se estamos vinculando um documento (NF-e/NFS-e) a um lançamento que 
    // já veio do financeiro, NÃO devemos sobrescrever a origem. Ele deve continuar
    // apontando para o lançamento financeiro, senão a checagem de duplicidade quebra.
    const updatePayload: any = {
      documento_tipo: docTipo,
      documento_numero: docNumero,
    }
    
    // Só atualiza origem_tipo se estivermos vinculando documento fiscal num lançamento manual 
    // (não vindo do financeiro). Se veio do financeiro, mantém a origem_id e origem_tipo intactos.
    if (lanc.origem_tipo !== 'financeiro') {
      updatePayload.origem_tipo = origemTipo
      updatePayload.origem_id = docId
    }

    if (docType === 'financeiro') {
       // Se o usuário vinculou a um financeiro, atualizamos a origem para o financeiro
       updatePayload.origem_tipo = origemTipo
       updatePayload.origem_id = docId
    }

    await sb.from('lancamentos_contabeis').update(updatePayload).eq('id', lancamentoId)

    // 3. Inserir Log de Auditoria
    const sbAdminLogger = createAdminSupabase()
    const { data: { user } } = await sb.auth.getUser()
    await sbAdminLogger.from('contabil_logs').insert({
      tenant_id: lanc.tenant_id,
      acao: 'VINCULO_MANUAL',
      detalhes: `Vínculo manual da nota ${docNumero || docId} ao lançamento contábil ${lancamentoId}.`,
      usuario_email: user?.email || 'sistema@integracao.com'
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function buscarCandidatosFinanceirosAction(termo: string) {
  const sb = await createServerSupabase()
  const { data } = await sb
    .from('lancamentos')
    .select('id, data, descricao, categoria, valor, tipo')
    .or(`descricao.ilike.%${termo}%,categoria.ilike.%${termo}%`)
    .limit(10)
  
  return { success: true, data: data || [] }
}

/**
 * Busca logs de integração contábil
 */
export async function getContabilLogsAction() {
  try {
    const { getMyTenantIdAction } = await import('@/app/actions/tenantActions')
    const tenantId = await getMyTenantIdAction()

    const sbAdmin = createAdminSupabase()
    let query = sbAdmin.from('contabil_logs').select('*')
    if (tenantId) query = query.eq('tenant_id', tenantId)
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
       console.warn('Erro ao buscar logs:', error.message)
       return { success: false, data: [], error: 'Falha ao recuperar logs de integração.' }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    return { success: false, data: [], error: err.message }
  }
}

/**
 * REORDENAÇÃO CRONOLÓGICA DEFINITIVA (LÓGICA DE FERRO)
 * Garante que a numeração siga a data real do fato contábil.
 */
export async function repararNumeracaoAction() {
  const { getMyTenantIdAction } = await import('@/app/actions/tenantActions')
  const tenantId = await getMyTenantIdAction()
  if (!tenantId) return { error: 'Tenant não identificado' }

  const sbAdmin = createAdminSupabase()
  
  // 1. Buscar TODOS os lançamentos de 2026
  const { data: lancs, error: fetchErr } = await sbAdmin
    .from('lancamentos_contabeis')
    .select('id, data_lancamento, numero_lancamento, created_at')
    .eq('tenant_id', tenantId)
    .gte('data_lancamento', '2026-01-01')
    .lte('data_lancamento', '2026-12-31')
  
  if (fetchErr) return { error: `Erro ao buscar lançamentos: ${fetchErr.message}` }
  if (!lancs || lancs.length === 0) return { success: true, message: 'Nenhum lançamento encontrado para reordenar.' }

  // 2. ORDENAÇÃO CRONOLÓGICA ROBUSTA
  const ordenados = [...lancs].sort((a, b) => {
    // Função auxiliar para garantir data comparável (YYYY-MM-DD)
    const parseDate = (d: string) => {
      if (!d) return 0
      // Se for YYYY-MM-DD
      if (d.includes('-')) return new Date(d + 'T12:00:00').getTime()
      // Se for DD/MM/YYYY
      if (d.includes('/')) {
        const [day, month, year] = d.split('/')
        return new Date(`${year}-${month}-${day}T12:00:00`).getTime()
      }
      return new Date(d).getTime()
    }

    const t1 = parseDate(a.data_lancamento)
    const t2 = parseDate(b.data_lancamento)
    
    if (t1 !== t2) return t1 - t2
    
    // Desempate por criação (ordem cronológica de inserção no mesmo dia)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  try {
    // 3. PASSO 1: RESET (Evita UNIQUE constraint violations)
    // Usamos um prefixo único baseado no timestamp para garantir que não haja colisões
    const resetPrefix = `RESET_${Date.now()}/`
    for (const l of ordenados) {
      await sbAdmin
        .from('lancamentos_contabeis')
        .update({ numero_lancamento: `${resetPrefix}${l.id.slice(0, 8)}` })
        .eq('id', l.id)
    }

    // 4. PASSO 2: ATRIBUIÇÃO SEQUENCIAL PERFEITA
    let seq = 1
    const ano = '2026'
    for (const l of ordenados) {
      const novoNumero = `${ano}/${seq.toString().padStart(6, '0')}`
      await sbAdmin
        .from('lancamentos_contabeis')
        .update({ numero_lancamento: novoNumero })
        .eq('id', l.id)
      seq++
    }

    const msg = `Sequência reconstruída! O primeiro lançamento de 2026 é agora o ${ano}/000001. Total: ${ordenados.length} lançamentos organizados por data de fato.`
    
    await sbAdmin.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'REORDENACAO_CRONOLOGICA',
      detalhes: msg,
      usuario_email: 'sistema@admin.com'
    })

    return { 
      success: true, 
      message: msg 
    }
  } catch (err: any) {
    console.error('[Contábil] Erro na reordenação global:', err)
    return { error: `Erro durante a reordenação: ${err.message}` }
  }
}

/**
 * Corrige um número de lançamento específico manualmente
 */
export async function fixSpecificEntryAction(currentNum: string, targetNum: string) {
  const sbAdmin = createAdminSupabase()
  const { data, error } = await sbAdmin
    .from('lancamentos_contabeis')
    .update({ numero_lancamento: targetNum })
    .eq('numero_lancamento', currentNum)
    .select('tenant_id')
    .single()
  
  if (error) return { success: false, error: error.message }

  if (data) {
    await sbAdmin.from('contabil_logs').insert({
      tenant_id: data.tenant_id,
      acao: 'CORRECAO_MANUAL',
      detalhes: `Lançamento renumerado manualmente de ${currentNum} para ${targetNum}.`,
      usuario_email: 'sistema@admin.com'
    })
  }

  return { success: true }
}
