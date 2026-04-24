import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

export interface ConfiguracaoContabil {
  id: string
  tenant_id: string
  categoria_nome: string
  conta_contabil_codigo: string // Código do Plano de Contas ITG 2002
  conta_contabil_nome: string
  tipo: 'ingresso' | 'dispendio'
  created_at: string
}

export function useConfiguracoesContabeis() {
  const tenantId = useTenantId()
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoContabil[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb
      .from('configuracoes_contabeis')
      .select('*')
      .eq('tenant_id', tenantId)
    
    setConfiguracoes(data ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetch() }, [fetch])

  const salvarMapping = async (categoria: string, contaCodigo: string, contaNome: string, tipo: 'ingresso' | 'dispendio') => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    // Upsert based on category name
    const { error } = await sb
      .from('configuracoes_contabeis')
      .upsert({
        tenant_id: tenantId,
        categoria_nome: categoria,
        conta_contabil_codigo: contaCodigo,
        conta_contabil_nome: contaNome,
        tipo,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,categoria_nome' })

    if (!error) fetch()
    return { error }
  }

  const removerMapping = async (id: string) => {
    const { error } = await sb.from('configuracoes_contabeis').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { configuracoes, loading, salvarMapping, removerMapping, refresh: fetch }
}
