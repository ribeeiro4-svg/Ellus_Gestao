'use client'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Associado, AssociadoInput } from '@/lib/types'
import { useTenant } from './useTenant'
import { fetchZapSignAssociatesAction, tempFixDatabaseAction, syncAdesaoFinanceiraAction } from '@/app/actions/zapsign'

const AssociadosContext = createContext<ReturnType<typeof useAssociadosInternal> | null>(null)

export function AssociadosProvider({ children }: { children: React.ReactNode }) {
  const value = useAssociadosInternal()
  return <AssociadosContext.Provider value={value}>{children}</AssociadosContext.Provider>
}

export function useAssociados() {
  const context = useContext(AssociadosContext)
  if (!context) throw new Error('useAssociados deve ser usado dentro de um AssociadosProvider')
  return context
}

function useAssociadosInternal() {
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
    const existing = associados.find(a => a.id === id)
    const { error } = await sb.from('associados').update(input).eq('id', id)
    if (!error) {
      const oldStatus = (existing?.status || '').toLowerCase()
      const newStatus = (input.status || '').toLowerCase()
      
      if (oldStatus === 'pendente' && newStatus === 'ativo' && tenantId) {
        const updatedAssoc = { ...existing, ...input }
        await syncAdesaoFinanceiraAction([updatedAssoc], tenantId)
      }
      fetch()
    }
    return { error }
  }

  const atualizarBulk = async (ids: string[], input: Partial<AssociadoInput>) => {
    const { error } = await sb.from('associados').update(input).in('id', ids)
    if (!error) {
      const newStatus = (input.status || '').toLowerCase()
      if (newStatus === 'ativo' && tenantId) {
        const toProcess = associados.filter(a => ids.includes(a.id as string) && (a.status || '').toLowerCase() === 'pendente').map(a => ({ ...a, ...input }))
        if (toProcess.length > 0) {
          await syncAdesaoFinanceiraAction(toProcess, tenantId)
        }
      }
      fetch()
    }
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
            zapsign_doc_token: it.zapsign_doc_token,
            zapsign_signers: it.zapsign_signers,
            data_assinatura: it.data_assinatura,
            // Atualiza data_ingresso (Associado Desde) para a data da assinatura do principal
            ...(it.data_assinatura ? { data_ingresso: it.data_assinatura } : {}),
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
      
      const logs: any[] = []
      
      if (novos.length > 0) {
        const { error: errIns } = await inserirBulk(novos)
        if (errIns) {
          console.error('Erro ao inserir novos:', errIns)
          novos.forEach(n => logs.push({ data: new Date().toISOString(), descricao: 'Importação ZapSign', associado: n.nome, status: 'erro', mensagem: 'Falha ao importar' }))
        } else {
          finalMsg += `${novos.length} novos associados importados. `
          novos.forEach(n => logs.push({ data: new Date().toISOString(), descricao: 'Importação ZapSign', associado: n.nome, status: 'sucesso', mensagem: 'Novo associado importado' }))
        }
      }

      if (paraAtualizarStatus.length > 0) {
        // Usamos update individual para cada um para evitar erros de constraint (como o 'nome' ser nulo num upsert parcial)
        // e para garantir que NENHUM outro campo seja alterado.
        const updatePromises = paraAtualizarStatus.map(async (item) => {
          const { id, ...dataToUpdate } = item
          const assoc = associados.find(a => a.id === id)
          const { error } = await sb.from('associados').update(dataToUpdate).eq('id', id)
          logs.push({
            data: new Date().toISOString(),
            descricao: 'Sincronização Status',
            associado: assoc?.nome || 'ID: ' + id,
            status: error ? 'erro' : 'sucesso',
            mensagem: error ? 'Erro na atualização' : 'Status ZapSign atualizado'
          })
          return { error }
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

      fetch()
      return { message: finalMsg, count: novos.length + paraAtualizarStatus.length, logs }
    } catch (err: any) {
      return { error: err.message || 'Falha na comunicação com o servidor de integração.' }
    } finally {
      setIsSyncing(false)
    }
  }

  const gerarAdesoesFinanceiras = async () => {
    if (!tenantId) return { error: 'Identificação da conta não encontrada.' }
    setIsSyncing(true)
    try {
      const { data: updatedAssocs } = await sb.from('associados').select('*').eq('tenant_id', tenantId)
      if (updatedAssocs) {
        const resAdesao = await syncAdesaoFinanceiraAction(updatedAssocs, tenantId)
        if (resAdesao.error) {
          return { error: resAdesao.error }
        }
        if (resAdesao.count && resAdesao.count > 0) {
          return { message: `${resAdesao.count} adesões financeiras provisionadas.` }
        }
        return { message: 'Nenhuma nova adesão para provisionar.' }
      }
      return { error: 'Nenhum associado encontrado.' }
    } catch (err: any) {
      return { error: err.message || 'Falha ao gerar adesões financeiras.' }
    } finally {
      setIsSyncing(false)
    }
  }

  const previewAdesoesFinanceiras = async () => {
    if (!tenantId) return { error: 'Identificação da conta não encontrada.' }
    setIsSyncing(true)
    try {
      const { data: updatedAssocs } = await sb.from('associados').select('*').eq('tenant_id', tenantId)
      if (updatedAssocs) {
        const resAdesao = await syncAdesaoFinanceiraAction(updatedAssocs, tenantId, true)
        if (resAdesao.error) return { error: resAdesao.error }
        return { preview: resAdesao.preview || [] }
      }
      return { error: 'Nenhum associado encontrado.' }
    } catch (err: any) {
      return { error: err.message || 'Falha ao processar previsão de adesões.' }
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

  return { associados, loading, isSyncing, inserir, atualizar, atualizarBulk, remover, inserirBulk, syncZapSign, gerarAdesoesFinanceiras, previewAdesoesFinanceiras, limparTudo, refresh: fetch, sb }
}
