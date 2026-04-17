import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface Diretor {
  id: string
  nome: string
  cargo: string
  cpf: string | null
  email: string | null
  telefone: string | null
  pro_labore_base: number
  status: 'ativo' | 'inativo'
  created_at: string
}

export function useDiretoria() {
  const [diretoria, setDiretoria] = useState<Diretor[]>([])
  const [loading, setLoading] = useState(true)
  const tenantId = useTenantId()
  const sb = createClient()

  const fetchDiretoria = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb
        .from('diretoria')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome')
      
      if (!error && data) {
        setDiretoria(data)
      }
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const inserir = async (obj: Partial<Diretor>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    const { data, error } = await sb
      .from('diretoria')
      .insert([{ ...obj, tenant_id: tenantId }])
      .select()
    if (!error) await fetchDiretoria()
    return { data, error }
  }

  const atualizar = async (id: string, obj: Partial<Diretor>) => {
    const { error } = await sb
      .from('diretoria')
      .update(obj)
      .eq('id', id)
    if (!error) await fetchDiretoria()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb
      .from('diretoria')
      .delete()
      .eq('id', id)
    if (!error) await fetchDiretoria()
    return { error }
  }

  useEffect(() => {
    fetchDiretoria()
  }, [fetchDiretoria])

  return { 
    diretoria, 
    loading, 
    fetch: fetchDiretoria, 
    inserir, 
    atualizar, 
    remover 
  }
}
