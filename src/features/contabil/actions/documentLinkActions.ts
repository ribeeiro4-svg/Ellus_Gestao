'use server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Busca candidatos (Financeiro e Notas Fiscais) para vincular a um lançamento contábil
 */
export async function buscarCandidatosVincularAction(lancamentoId: string) {
  const sb = await createServerSupabase()
  
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
    const { data: vinculos } = await sb
      .from('nfse_financeiro_vinculo')
      .select('nfse:nfse_id(id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome))')
      .eq('financeiro_id', lanc.origem_id)
    
    if (vinculos) {
      nfsePorVinculo = vinculos.map((v: any) => v.nfse).filter(Boolean)
    }
  }

  // 4b. Busca por Prestadores (Nome ou CNPJ)
  let prestadorIds: string[] = []
  const { data: prestadoresMatch } = await sb
    .from('fornecedores')
    .select('id')
    .or(`nome.ilike.%${termoPrincipal}%,cpf_cnpj.ilike.%${cnpjLimpo || termoPrincipal}%`)
  
  if (prestadoresMatch) prestadorIds = prestadoresMatch.map(p => p.id)

  // Adiciona prestadores por fragmentos do nome
  if (partes.length > 0) {
    const { data: prestadoresFragmentos } = await sb
      .from('fornecedores')
      .select('id')
      .or(partes.map((p: string) => `nome.ilike.%${p}%`).join(','))
    if (prestadoresFragmentos) {
      prestadorIds = [...new Set([...prestadorIds, ...prestadoresFragmentos.map(p => p.id)])]
    }
  }

  // 4c. Busca as Notas dos Prestadores encontrados + busca por número da nota
  const { data: nfsePorBusca } = await sb
    .from('nfse_entradas')
    .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
    .or(`numero_nfse.ilike.%${termoPrincipal}%,prestador_id.in.(${prestadorIds.length > 0 ? prestadorIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    .limit(20)

  const nfseMap = new Map();
  [...nfsePorVinculo, ...(nfsePorBusca || [])].forEach(n => nfseMap.set(n.id, n));
  
  // 4d. Fallback: Se não achou nada, busca notas recentes do mesmo mês
  if (nfseMap.size === 0) {
    const mes = lanc.data_lancamento.slice(0, 7)
    const { data: recentNfse } = await sb
      .from('nfse_entradas')
      .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
      .gte('data_emissao', `${mes}-01`)
      .lte('data_emissao', `${mes}-31`)
      .limit(5)
    if (recentNfse) recentNfse.forEach(n => nfseMap.set(n.id, n))
  }

  const nfseBase = Array.from(nfseMap.values())

  // Adicionar info de vínculo financeiro para o modal
  const nfseIds = nfseBase.map(n => n.id)
  const { data: vinculosExistentes } = await sb.from('nfse_financeiro_vinculo').select('nfse_id, financeiro_id').in('nfse_id', nfseIds)
  
  const nfse = nfseBase.map(n => ({
    ...n,
    financeiro_vinculado_id: vinculosExistentes?.find(v => v.nfse_id === n.id)?.financeiro_id || null
  }))
  
  // Se não achou pelo número/vínculo, tenta pelo nome ou CNPJ do prestador
  let nfseComplementar: any[] = []
  if (!nfse || nfse.length === 0) {
     const { data: prestadores } = await sb.from('fornecedores').select('id').or(`nome.ilike.%${termoPrincipal}%,cpf_cnpj.ilike.%${termoPrincipal}%`)
     if (prestadores && prestadores.length > 0) {
        const { data: nfs } = await sb.from('nfse_entradas')
          .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
          .in('prestador_id', prestadores.map(p => p.id))
          .limit(10)
        nfseComplementar = nfs || []
     }
  }

  // 5. Buscar em NF-e (Produtos)
  // 5a. Busca direta por vínculo financeiro (mais preciso)
  let nfePorVinculo: any[] = []
  if (lanc.origem_tipo === 'financeiro' && lanc.origem_id) {
    const { data: nfeV } = await sb
      .from('nfe_entradas')
      .select('id, numero_nf, data_emissao, valor_total, nome_emitente')
      .eq('lancamento_financeiro_id', lanc.origem_id)
    if (nfeV) nfePorVinculo = nfeV
  }

  const { data: nfePorTermo } = await sb
    .from('nfe_entradas')
    .select('id, numero_nf, data_emissao, valor_total, nome_emitente')
    .or(`numero_nf.ilike.%${termoPrincipal}%,nome_emitente.ilike.%${termoPrincipal}%`)
    .limit(10)

  const nfeMap = new Map();
  [...nfePorVinculo, ...(nfePorTermo || [])].forEach(n => nfeMap.set(n.id, n));
  const nfe = Array.from(nfeMap.values())

  return {
    success: true,
    data: {
      financial: financial || [],
      nfse: [...nfse, ...nfseComplementar].slice(0, 10),
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
      const { data: nfse } = await sb.from('nfse_entradas').select('numero_nfse').eq('id', docId).single()
      docNumero = nfse?.numero_nfse || ''
      docTipo = 'NF'
      origemTipo = 'fiscal_nfse'
      // Marcar nota como vinculada/escriturada
      await sb.from('nfse_entradas').update({ status_escrituracao: 'concluida', lancamento_contabil_id: lancamentoId }).eq('id', docId)
    } else if (docType === 'nfe') {
      const { data: nfe } = await sb.from('nfe_entradas').select('numero_nf').eq('id', docId).single()
      docNumero = nfe?.numero_nf || ''
      docTipo = 'NF'
      origemTipo = 'fiscal'
      await sb.from('nfe_entradas').update({ status_escrituracao: 'concluida', lancamento_contabil_id: lancamentoId }).eq('id', docId)
    } else if (docType === 'financeiro') {
      origemTipo = 'financeiro'
      // O financeiro pode ter uma NF vinculada
      const { data: fin } = await sb.from('lancamentos').select('documento').eq('id', docId).single()
      docNumero = fin?.documento || ''
      docTipo = docNumero ? 'NF' : ''
    }

    // 2. Atualizar Lançamento Contábil
    await sb.from('lancamentos_contabeis').update({
      documento_tipo: docTipo || lanc.documento_tipo,
      documento_numero: docNumero || lanc.documento_numero,
      origem_tipo: origemTipo,
      origem_id: docId,
      reprocessado_at: new Date().toISOString()
    }).eq('id', lancamentoId)

    // 3. Registrar LOG
    await sb.from('contabil_logs').insert({
      tenant_id: lanc.tenant_id,
      acao: 'VÍNCULO MANUAL',
      detalhes: `Lançamento ${lanc.numero_lancamento} vinculado a ${docType.toUpperCase()} (ID: ${docId})`,
      historico_anterior: lanc.historico,
      usuario_id: (await sb.auth.getUser()).data.user?.id
    })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Busca os logs de reprocessamento para exibir no Livro Diário
 */
export async function getContabilLogsAction() {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { data: [] }

  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  
  const { data } = await sb
    .from('contabil_logs')
    .select('*')
    .eq('tenant_id', userData?.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return { data: data || [] }
}
