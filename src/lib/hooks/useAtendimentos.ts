'use client'
import { useCallback } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export function useAtendimentos() {
  const tenantId = useTenantId()
  const sb = createClient()
  
  const { data, isLoading, mutate } = useSWR(
    tenantId ? ['atendimentos_data', tenantId] : null,
    async () => {
      const { data: atendData } = await sb.from('atendimentos')
        .select('*, associados(nome, cpf, email, telefone, data_ingresso, zapsign_doc_token, zapsign_signers, data_assinatura)')
        .eq('tenant_id', tenantId)
        .order('data_agendamento', { ascending: false })
        
      const { data: respData } = await sb.from('responsaveis_atendimento')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome', { ascending: true })
        
      return {
        atendimentos: atendData || [],
        responsaveis: respData || []
      }
    },
    { revalidateOnFocus: true, revalidateOnReconnect: true }
  )

  const atendimentos = data?.atendimentos || []
  const responsaveis = data?.responsaveis || []
  const loading = isLoading

  const fetch = useCallback(async () => {
    await mutate()
  }, [mutate])

  const inserir = async (input: any) => {
    if (!tenantId) return { error: 'Tenant ID não encontrado' }
    const { error } = await sb.from('atendimentos').insert({ ...input, tenant_id: tenantId })
    if (!error) await mutate()
    return { error }
  }

  const atualizar = async (id: string, input: any) => {
    const { error } = await sb.from('atendimentos').update(input).eq('id', id)
    if (!error) await mutate()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('atendimentos').delete().eq('id', id)
    if (!error) await mutate()
    return { error }
  }

  const inserirResponsavel = async (input: any) => {
    if (!tenantId) return { error: 'Tenant ID não encontrado' }
    const { error } = await sb.from('responsaveis_atendimento').insert({ ...input, tenant_id: tenantId })
    if (!error) await mutate()
    return { error }
  }

  const atualizarResponsavel = async (id: string, input: any) => {
    const { error } = await sb.from('responsaveis_atendimento').update(input).eq('id', id)
    if (!error) await mutate()
    return { error }
  }

  const removerResponsavel = async (id: string) => {
    const { error } = await sb.from('responsaveis_atendimento').delete().eq('id', id)
    if (!error) await mutate()
    return { error }
  }

  return { 
    atendimentos, 
    responsaveis,
    loading, 
    inserir, 
    atualizar, 
    remover, 
    inserirResponsavel,
    atualizarResponsavel,
    removerResponsavel,
    refresh: fetch, 
    sb 
  }
}
