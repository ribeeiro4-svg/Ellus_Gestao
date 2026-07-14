import { useCallback } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import { Adiantamento, DiretoriaConfig } from '../types'

export function useAdiantamentos() {
  const tenantId = useTenantId()
  const sb = createClient()


  // SWR for Config
  const { data: configData, mutate: mutateConfig } = useSWR<DiretoriaConfig>(
    tenantId ? ['diretoria_config', tenantId] : null,
    async () => {
      const { data, error } = await sb
        .from('diretoria_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      if (!data) {
        // Return defaults if none
        return {
          tenant_id: tenantId as string,
          max_percent_adiantamento: 40.0,
          permitir_emprestimo: true,
          exigir_aprovacao_presidencia: true,
          exigir_aprovacao_tesouraria: true,
          permitir_parcelamento: true,
          max_parcelas: 12,
          categoria_adiantamento: 'Adiantamento de Pró-labore',
          categoria_emprestimo: 'Empréstimo à Diretoria',
          updated_at: new Date().toISOString()
        }
      }
      return data as DiretoriaConfig
    }
  )

  // SWR for Adiantamentos
  const { data: adiantamentosData, isLoading, mutate } = useSWR<Adiantamento[]>(
    tenantId ? ['diretoria_adiantamentos', tenantId] : null,
    async () => {
      const { data, error } = await sb
        .from('diretoria_adiantamentos')
        .select('*, diretor:diretoria(nome)')
        .eq('tenant_id', tenantId)
        .order('data_solicitacao', { ascending: false })
      
      if (error) throw error
      
      return data.map((item: any) => ({
        ...item,
        diretor_nome: item.diretor?.nome
      })) as Adiantamento[]
    }
  )

  const adiantamentos = adiantamentosData || []
  const config = configData

  const saveConfig = async (newConfig: Partial<DiretoriaConfig>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    const { error } = await sb
      .from('diretoria_config')
      .upsert({ ...newConfig, tenant_id: tenantId, updated_at: new Date().toISOString() })
    
    if (!error) await mutateConfig()
    return { error }
  }

  const criar = async (obj: Partial<Adiantamento>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    const payload = {
      ...obj,
      tenant_id: tenantId,
      created_by: 'Sistema'
    }
    const { data, error } = await sb
      .from('diretoria_adiantamentos')
      .insert([payload])
      .select()
      .single()

    if (!error) await mutate()
    return { data, error }
  }

  const atualizarStatus = async (
    id: string, 
    novoStatus: Adiantamento['status'], 
    extra?: Partial<Adiantamento>
  ) => {
    const payload: any = { 
      status: novoStatus, 
      updated_at: new Date().toISOString(),
      updated_by: 'Sistema',
      ...extra 
    }
    
    // Auto timestamping based on status
    if (novoStatus === 'APROVADO') payload.data_aprovacao = new Date().toISOString()
    if (novoStatus === 'PAGO') payload.data_pagamento = new Date().toISOString()

    const { data, error } = await sb
      .from('diretoria_adiantamentos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (!error) await mutate()
    return { data, error }
  }

  const excluir = async (id: string) => {
    const { error } = await sb
      .from('diretoria_adiantamentos')
      .delete()
      .eq('id', id)
    
    if (!error) await mutate()
    return { error }
  }

  // Integração com Financeiro
  const efetuarPagamentoFinanceiro = async (adiantamento: Adiantamento, conta_id: string, qtdParcelas: number = 1, dataInicio: string = new Date().toISOString().split('T')[0], formaPagamento: string = 'PIX') => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    if (!config) return { error: 'Configuração não carregada' }

    const categoria = adiantamento.tipo === 'ADIANTAMENTO' ? config.categoria_adiantamento : config.categoria_emprestimo
    const valorPorParcela = adiantamento.valor / qtdParcelas

    // 1. Criar Lançamentos no Financeiro
    const lancamentosInsert = []
    const dataBase = new Date(dataInicio)
    
    for (let i = 0; i < qtdParcelas; i++) {
      const isPrimeira = i === 0
      const descParcela = qtdParcelas > 1 ? ` - Pagamento Parcela ${i + 1}/${qtdParcelas}` : ''
      const descricao = `${adiantamento.tipo} - ${adiantamento.diretor_nome || 'Diretor'}${descParcela}`

      // Adiciona i meses à data inicial
      const dataVenc = new Date(dataBase.getFullYear(), dataBase.getMonth() + i, dataBase.getDate())
      
      lancamentosInsert.push({
        tenant_id: tenantId,
        data: dataVenc.toISOString().split('T')[0],
        descricao: descricao,
        categoria: categoria,
        tipo: 'despesa',
        valor: valorPorParcela,
        status: isPrimeira ? 'pago' : 'pendente', // 1ª parcela já fica paga, as demais pendentes
        forma_pagamento: formaPagamento,
        conta_id: conta_id,
        diretor_id: adiantamento.diretor_id
      })
    }

    const { data: lancs, error: errLanc } = await sb
      .from('lancamentos')
      .insert(lancamentosInsert)
      .select()

    if (errLanc) return { error: errLanc.message }

    // 2. Atualizar o adiantamento como PAGO
    const { error: errUpdate } = await atualizarStatus(adiantamento.id, 'PAGO', {
      lancamento_financeiro_id: lancs?.[0]?.id,
      conta_financeira_id: conta_id
    })

    return { error: errUpdate }
  }

  return {
    adiantamentos,
    config,
    loading: isLoading,
    criar,
    atualizarStatus,
    excluir,
    saveConfig,
    efetuarPagamentoFinanceiro,
    refresh: mutate
  }
}
