import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface DiretorPeriodo {
  id: string
  valor: number
  mes_inicio: number
  ano_inicio: number
  mes_fim?: number
  ano_fim?: number
}

export interface Diretor {
  id: string
  nome: string
  cargo: string
  cpf: string | null
  email: string | null
  telefone: string | null
  pro_labore_base: number
  status: 'ativo' | 'inativo'
  endereco?: string | null
  chave_pix?: string | null
  banco_info?: string | null
  created_at: string
  periodos?: DiretorPeriodo[]
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
      const { data: dirs, error: errDirs } = await sb
        .from('diretoria')
        .select('*, periodos:diretoria_pro_labores(*)')
        .eq('tenant_id', tenantId)
        .order('nome')
      
      if (!errDirs && dirs) {
        setDiretoria(dirs)
      }
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const inserir = async (obj: Partial<Diretor>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    const { periodos, ...rest } = obj
    
    // 1. Inserir Diretor
    const { data: newDir, error: errDir } = await sb
      .from('diretoria')
      .insert([{ ...rest, tenant_id: tenantId }])
      .select()
      .single()

    if (errDir) return { error: errDir }

    // 2. Inserir Períodos se houver
    if (periodos && periodos.length > 0) {
      await sb.from('diretoria_pro_labores').insert(
        periodos.map(p => ({ ...p, id: undefined, diretor_id: newDir.id }))
      )
    }

    await fetchDiretoria()
    return { data: newDir, error: null }
  }

  const atualizar = async (id: string, obj: Partial<Diretor>) => {
    const { periodos, ...rest } = obj
    
    // 1. Atualizar Diretor
    const { error: errUpdate } = await sb
      .from('diretoria')
      .update(rest)
      .eq('id', id)

    if (errUpdate) return { error: errUpdate }

    // 2. Sincronizar Períodos (Deletar e Re-inserir para simplificar)
    if (periodos) {
      await sb.from('diretoria_pro_labores').delete().eq('diretor_id', id)
      if (periodos.length > 0) {
        await sb.from('diretoria_pro_labores').insert(
          periodos.map(p => ({
            valor: p.valor,
            mes_inicio: p.mes_inicio,
            ano_inicio: p.ano_inicio,
            mes_fim: p.mes_fim,
            ano_fim: p.ano_fim,
            diretor_id: id
          }))
        )
      }
    }

    await fetchDiretoria()
    return { error: null }
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
