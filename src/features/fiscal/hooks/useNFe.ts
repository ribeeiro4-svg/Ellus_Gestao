import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

export interface NFe {
  id: string
  tenant_id: string
  periodo_apuracao: string
  chave_acesso: string
  numero_nf: string
  serie: string
  data_emissao: string
  data_entrada: string
  cnpj_emitente: string
  nome_emitente: string
  uf_emitente: string
  crt_emitente: string
  nat_operacao: string
  valor_produtos: number
  valor_frete: number
  valor_seguro: number
  valor_desconto: number
  valor_ipi: number
  valor_total: number
  valor_icms: number
  valor_pis: number
  valor_cofins: number
  inf_complementar: string
  status_escrituracao: string
  status_conciliacao: string
  status_sefaz: string
  observacoes_fiscais: string
  created_at: string
  itens?: NFeItem[]
}

export interface NFeItem {
  id: string
  nfe_entrada_id: string
  numero_item: number
  codigo_produto: string
  descricao_produto: string
  ncm: string
  cfop_nfe: string
  cfop_escrituracao: string
  unidade_comercial: string
  quantidade: number
  valor_unitario: number
  valor_produto: number
  orig_icms: string
  cst_icms: string
  aliq_icms: number
  valor_icms: number
  valor_icms_st: number
  cst_ipi: string
  aliq_ipi: number
  valor_ipi: number
  cst_pis: string
  aliq_pis: number
  valor_pis: number
  cst_cofins: string
  aliq_cofins: number
  valor_cofins: number
  destinacao_item: string
  aproveitamento_credito: boolean
  motivo_nao_aproveitamento: string
  obs_fiscal: string
  classificado: boolean
  conta_contabil_id?: string
  produto_vinc_id?: string
  data_classificacao?: string
}

export function useNFe() {
  const tenantId = useTenantId()
  const [nfes, setNfes] = useState<NFe[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPeriodo, setFilterPeriodo] = useState<string>('')
  const sb = createClient()

  const fetch = useCallback(async (periodo?: string) => {
    if (!tenantId) return
    setLoading(true)
    try {
      let query = sb.from('nfe_entradas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('data_emissao', { ascending: false })

      if (periodo) {
        const [ano, mes] = periodo.split('-')
        const start = `${ano}-${mes}-01`
        const lastDay = new Date(parseInt(ano), parseInt(mes), 0).getDate()
        const end = `${ano}-${mes}-${lastDay}`
        query = query.gte('data_emissao', start).lte('data_emissao', end)
      }

      const { data, error } = await query.limit(500)
      if (error) throw error
      setNfes(data ?? [])
    } catch (err) {
      console.error('Error fetching NF-e:', err)
      setNfes([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { fetch(filterPeriodo) }, [fetch, filterPeriodo])

  const importarNFe = async (nfeData: Omit<NFe, 'id' | 'created_at'>, itens: Omit<NFeItem, 'id' | 'nfe_entrada_id'>[]) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    // Verificar duplicidade pela chave de acesso
    if (nfeData.chave_acesso) {
      const { data: existing } = await sb.from('nfe_entradas')
        .select('id, numero_nf')
        .eq('tenant_id', tenantId)
        .eq('chave_acesso', nfeData.chave_acesso)
        .limit(1)

      if (existing && existing.length > 0) {
        return { error: `NF-e ${nfeData.numero_nf} (chave: ${nfeData.chave_acesso.slice(-8)}) já foi importada anteriormente.` }
      }
    }

    const { data: nfeInserted, error: nfeError } = await sb.from('nfe_entradas')
      .insert({ ...nfeData, tenant_id: tenantId })
      .select()
      .single()

    if (nfeError) return { error: nfeError.message }

    if (itens.length > 0) {
      const itensComId = itens.map(item => ({
        ...item,
        nfe_entrada_id: nfeInserted.id,
      }))
      const { error: itensError } = await sb.from('nfe_entradas_itens').insert(itensComId)
      if (itensError) return { error: itensError.message }
    }

    await fetch(filterPeriodo)
    return { error: null, id: nfeInserted.id }
  }

  const buscarItens = async (nfeId: string): Promise<NFeItem[]> => {
    const { data, error } = await sb.from('nfe_entradas_itens')
      .select('*')
      .eq('nfe_entrada_id', nfeId)
      .order('numero_item')
    if (error) return []
    return data ?? []
  }

  const salvarClassificacao = async (nfeId: string, itens: any[]) => {
    try {
      for (const item of itens) {
        // Um item só é considerado classificado se tiver CFOP e Destinação
        const isItemClassificado = !!(item.cfop_escrituracao && item.destinacao_item)
        
        // Função auxiliar para pegar apenas o código antes do " - " ou limitar o tamanho
        const limparCodigo = (val: string | null, max: number) => {
          if (!val) return null
          const soCodigo = val.split(' ')[0].split('-')[0].trim()
          return soCodigo.substring(0, max)
        }

        const updateData: any = {
          cfop_escrituracao: limparCodigo(item.cfop_escrituracao, 4),
          cst_icms: limparCodigo(item.cst_icms, 3),
          cst_ipi: limparCodigo(item.cst_ipi, 2),
          cst_pis: limparCodigo(item.cst_pis, 2),
          cst_cofins: limparCodigo(item.cst_cofins, 2),
          destinacao_item: limparCodigo(item.destinacao_item, 2),
          aproveitamento_credito: !!item.aproveitamento_credito,
          motivo_nao_aproveitamento: item.motivo_nao_aproveitamento || null,
          obs_fiscal: item.obs_fiscal || null,
          conta_contabil_id: item.conta_contabil_id || null,
          classificado: isItemClassificado,
          data_classificacao: isItemClassificado ? new Date().toISOString() : null,
        }

        // Só incluir produto_vinc_id se ele existir no objeto (proteção contra erro de coluna)
        if (item.produto_vinc_id) {
          updateData.produto_vinc_id = item.produto_vinc_id
        }

        const { error: itemError } = await sb
          .from('nfe_entradas_itens')
          .update(updateData)
          .eq('id', item.id)

        if (itemError) {
          console.error(`Erro no item ${item.numero_item}:`, itemError)
          // Se falhar por coluna inexistente (produto_vinc_id), tentamos sem ela
          if (itemError.message.includes('produto_vinc_id')) {
            const { produto_vinc_id, ...fallbackData } = updateData
            await sb.from('nfe_entradas_itens').update(fallbackData).eq('id', item.id)
          } else {
            return { error: `Erro no item ${item.numero_item}: ${itemError.message}` }
          }
        }
      }

      // 2. Atualizar status global da nota
      const todosClassificados = itens.every(i => !!(i.cfop_escrituracao && i.destinacao_item))
      const algumClassificado = itens.some(i => !!(i.cfop_escrituracao || i.destinacao_item))

      const { error: nfeError } = await sb.from('nfe_entradas')
        .update({
          status_escrituracao: todosClassificados ? 'escriturada' : (algumClassificado ? 'em_andamento' : 'pendente'),
          data_escrituracao: todosClassificados ? new Date().toISOString() : null,
        })
        .eq('id', nfeId)

      if (!nfeError) await fetch(filterPeriodo)
      return { error: nfeError?.message || null }

    } catch (err: any) {
      console.error('Erro fatal no salvamento:', err)
      return { error: err.message }
    }
  }

  const atualizarStatus = async (id: string, status: string) => {
    const { error } = await sb.from('nfe_entradas').update({ status_escrituracao: status }).eq('id', id)
    if (!error) await fetch(filterPeriodo)
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('nfe_entradas').delete().eq('id', id)
    if (!error) await fetch(filterPeriodo)
    return { error }
  }

  const removerLote = async (ids: string[]) => {
    if (!ids.length) return { error: null }
    const { error } = await sb.from('nfe_entradas').delete().in('id', ids)
    if (!error) await fetch(filterPeriodo)
    return { error }
  }

  // Buscar sugestões de classificação baseadas no histórico
  const buscarSugestoes = async (cnpjEmitente: string, ncm: string, cProd: string) => {
    const { data } = await sb.from('regras_classificacao_fiscal')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cnpj_emitente', cnpjEmitente)
      .order('confianca', { ascending: false })
      .limit(1)
    return data?.[0] ?? null
  }

  // Memorizar regra de classificação
  const memorizarClassificacao = async (regra: {
    cnpjEmitente: string
    ncm: string
    codigoProduto: string
    cfopSugerido: string
    cstIcmsSugerido: string
    destinacaoSugerida: string
  }) => {
    const existing = await buscarSugestoes(regra.cnpjEmitente, regra.ncm, regra.codigoProduto)
    if (existing) {
      await sb.from('regras_classificacao_fiscal').update({
        total_confirmacoes: (existing.total_confirmacoes || 0) + 1,
        confianca: Math.min(100, ((existing.total_confirmacoes || 0) + 1) * 10),
        ultima_atualizacao: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await sb.from('regras_classificacao_fiscal').insert({
        tenant_id: tenantId,
        cnpj_emitente: regra.cnpjEmitente,
        ncm: regra.ncm,
        codigo_produto_emitente: regra.codigoProduto,
        cfop_sugerido: regra.cfopSugerido,
        cst_icms_sugerido: regra.cstIcmsSugerido,
        destinacao_sugerida: regra.destinacaoSugerida,
        confianca: 10,
      })
    }
  }

  // Stats para dashboard
  const stats = {
    total: nfes.length,
    pendentes: nfes.filter(n => n.status_escrituracao === 'pendente').length,
    escrituradas: nfes.filter(n => n.status_escrituracao === 'escriturada').length,
    comInconsistencia: nfes.filter(n => n.status_escrituracao === 'com_inconsistencia').length,
    valorTotalICMS: nfes.reduce((acc, n) => acc + (n.valor_icms || 0), 0),
    valorTotalIPI: nfes.reduce((acc, n) => acc + (n.valor_ipi || 0), 0),
    valorTotalPIS: nfes.reduce((acc, n) => acc + (n.valor_pis || 0), 0),
    valorTotalCOFINS: nfes.reduce((acc, n) => acc + (n.valor_cofins || 0), 0),
    valorTotalNFes: nfes.reduce((acc, n) => acc + (n.valor_total || 0), 0),
  }

  return {
    nfes, loading, stats,
    filterPeriodo, setFilterPeriodo,
    importarNFe, buscarItens, salvarClassificacao,
    atualizarStatus, remover, removerLote,
    buscarSugestoes, memorizarClassificacao,
    refresh: () => fetch(filterPeriodo),
  }
}
