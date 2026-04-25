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

  // 2. Extrair termo de busca do histórico
  // Ex: "PAG — Pgto QR Code Pix - MAGALUPAY" -> "MAGALUPAY"
  let termo = lanc.historico || ''
  if (termo.includes(' - ')) {
    termo = termo.split(' - ').pop() || termo
  } else if (termo.includes(' — ')) {
    termo = termo.split(' — ').pop() || termo
  }
  termo = termo.trim()

  // 3. Buscar no Financeiro (lancamentos)
  // Filtra por valor aproximado ou termo na descrição
  const { data: financial } = await sb
    .from('lancamentos')
    .select('id, data, descricao, categoria, valor, tipo')
    .or(`descricao.ilike.%${termo}%,categoria.ilike.%${termo}%`)
    .limit(10)

  // 4. Buscar em NFS-e
  const { data: nfse } = await sb
    .from('nfse_entradas')
    .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
    .or(`numero_nfse.ilike.%${termo}%`)
    .limit(10)
  
  // Se não achou pelo número, tenta pelo nome do prestador
  let nfseComplementar: any[] = []
  if (!nfse || nfse.length === 0) {
     const { data: prestadores } = await sb.from('fornecedores').select('id').ilike('nome', `%${termo}%`)
     if (prestadores && prestadores.length > 0) {
        const { data: nfs } = await sb.from('nfse_entradas')
          .select('id, numero_nfse, data_emissao, valor_bruto, fornecedores(nome)')
          .in('prestador_id', prestadores.map(p => p.id))
          .limit(10)
        nfseComplementar = nfs || []
     }
  }

  // 5. Buscar em NF-e (Produtos)
  const { data: nfe } = await sb
    .from('nfe_entradas')
    .select('id, numero_nf, data_emissao, valor_total, nome_emitente')
    .or(`numero_nf.ilike.%${termo}%,nome_emitente.ilike.%${termo}%`)
    .limit(10)

  return {
    success: true,
    data: {
      financial: financial || [],
      nfse: [...(nfse || []), ...nfseComplementar].slice(0, 10),
      nfe: nfe || []
    }
  }
}

/**
 * Vincula o lançamento contábil a um documento e reprocessa a integração
 */
export async function vincularEDocumentoReprocessarAction(params: {
  lancamentoId: string,
  docType: 'financeiro' | 'nfse' | 'nfe',
  docId: string
}) {
  const sb = await createServerSupabase()
  const { lancamentoId, docType, docId } = params

  try {
    // 1. Buscar dados dos envolvidos
    const { data: lanc } = await sb.from('lancamentos_contabeis').select('*').eq('id', lancamentoId).single()
    if (!lanc) throw new Error('Lançamento contábil não encontrado')

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
