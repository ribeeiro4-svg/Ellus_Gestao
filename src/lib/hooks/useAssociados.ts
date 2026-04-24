'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Associado, AssociadoInput } from '@/lib/types'
import { useTenant } from './useTenant'
import { fetchZapSignAssociatesAction, tempFixDatabaseAction, syncAdesaoFinanceiraAction } from '@/app/actions/zapsign'

export function useAssociados() {
  const tenantId = useTenantId()
  const { tenant } = useTenant()
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('associados')
      .select('*').eq('tenant_id', tenantId)
      .order('nome')
    setAssociados(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: AssociadoInput) => {
    const { error } = await sb.from('associados').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<AssociadoInput>) => {
    const { error } = await sb.from('associados').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const atualizarBulk = async (ids: string[], input: Partial<AssociadoInput>) => {
    const { error } = await sb.from('associados').update(input).in('id', ids)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('associados').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: AssociadoInput[]) => {
    if (!tenantId) {
      console.error('Tentativa de inserirBulk associados sem tenant_id')
      return { error: 'Identificação da conta não encontrada. Tente atualizar a página.' }
    }
    const rows = items.map(it => ({
      ...it,
      tenant_id: tenantId
    }))
    // Usamos UPSERT direto para garantir flexibilidade com novos campos como zapsign_doc_token
    const { error } = await sb.from('associados').upsert(rows, { onConflict: 'tenant_id,codigo' })
    if (!error) fetch()
    return { error }
  }

  const syncZapSign = async () => {
    if (!tenant?.zapsign_token) {
      return { error: 'Token da ZapSign não configurado. Vá em Configurações.' }
    }

    setIsSyncing(true)
    try {
      const res = await fetchZapSignAssociatesAction(tenant.zapsign_token)
      
      if (res.error) return { error: res.error }
      if (!res.data || res.data.length === 0) return { message: 'Nenhum dado encontrado na ZapSign.' }
      
      const codigosExistentes = new Map(associados.map(a => [(a.codigo || '').toLowerCase(), a]))
      
      const novos: AssociadoInput[] = []
      const paraAtualizarStatus: any[] = []

      res.data.forEach(it => {
        const itCodigoLower = (it.codigo || '').toLowerCase()
        const existing = codigosExistentes.get(itCodigoLower)
        if (existing) {
          // Atualiza APENAS campos de assinatura para não perder dados manuais
          paraAtualizarStatus.push({
            id: existing.id,
            tenant_id: tenantId,
            codigo: existing.codigo, // Inclui o código original para evitar conflito de Unique Constraint
            status: existing.status === 'inativo' ? 'inativo' : it.status,
            zapsign_doc_token: it.zapsign_doc_token,
            zapsign_signers: it.zapsign_signers,
            zapsign_sync_at: new Date().toISOString()
          })
        } else {
          // Novo associado: traz tudo
          novos.push({
            ...it,
            zapsign_sync_at: new Date().toISOString()
          })
        }
      })

      let finalMsg = ''
      
      if (novos.length > 0) {
        const { error: errIns } = await inserirBulk(novos)
        if (errIns) console.error('Erro ao inserir novos:', errIns)
        else finalMsg += `${novos.length} novos associados importados. `
      }

      if (paraAtualizarStatus.length > 0) {
        // Usamos update individual para cada um para evitar erros de constraint (como o 'nome' ser nulo num upsert parcial)
        // e para garantir que NENHUM outro campo seja alterado.
        const updatePromises = paraAtualizarStatus.map(item => {
          const { id, ...dataToUpdate } = item
          return sb.from('associados').update(dataToUpdate).eq('id', id)
        })
        
        const results = await Promise.all(updatePromises)
        const errors = results.filter(r => r.error)
        
        if (errors.length > 0) {
          console.error('Erros ao atualizar status:', errors)
          finalMsg += `(${errors.length} erros na atualização). `
        } else {
          finalMsg += `${paraAtualizarStatus.length} status de assinatura atualizados.`
        }
      }

      if (!finalMsg) finalMsg = 'Sincronização concluída: Todos os dados já estavam atualizados.'
      
      // Nova Etapa: Lançar ADESÃO financeira para os novos e ativos
      const { data: updatedAssocs } = await sb.from('associados').select('*').eq('tenant_id', tenantId)
      if (updatedAssocs) {
        const resAdesao = await syncAdesaoFinanceiraAction(updatedAssocs, tenantId)
        if (resAdesao.count && resAdesao.count > 0) {
          finalMsg += ` | ${resAdesao.count} adesões financeiras provisionadas.`
        }
      }

      fetch()
      return { message: finalMsg, count: novos.length + paraAtualizarStatus.length }
    } catch (err: any) {
      return { error: err.message || 'Falha na comunicação com o servidor de integração.' }
    } finally {
      setIsSyncing(false)
    }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setAssociados([])
      return { error: null }
    }
    const { error } = await sb.from('associados').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  return { associados, loading, isSyncing, inserir, atualizar, atualizarBulk, remover, inserirBulk, syncZapSign, limparTudo, refresh: fetch }
}
