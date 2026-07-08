'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface ComunicadoTemplate {
  id: string
  tenant_id: string
  nome: string
  categoria: string
  conteudo: string
  created_at: string
  updated_at: string
  criado_por?: string
}

export interface ComunicadoHistorico {
  id: string
  tenant_id: string
  data_envio: string
  associado_id?: string
  associado_nome: string
  associado_telefone: string
  template_id?: string
  template_nome: string
  conteudo_enviado: string
  canal: string
  status: string
  usuario_nome: string
  usuario_email?: string
  created_at: string
}

export function useComunicados() {
  const tenantId = useTenantId()
  const sb = createClient()
  
  const [templates, setTemplates] = useState<ComunicadoTemplate[]>([])
  const [historico, setHistorico] = useState<ComunicadoHistorico[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingHistorico, setLoadingHistorico] = useState(true)

  const fetchTemplates = useCallback(async () => {
    if (!tenantId) return
    setLoadingTemplates(true)
    const { data, error } = await sb
      .from('comunicados_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome')
    
    if (data && !error) {
      setTemplates(data as ComunicadoTemplate[])
    }
    setLoadingTemplates(false)
  }, [tenantId, sb])

  const fetchHistorico = useCallback(async () => {
    if (!tenantId) return
    setLoadingHistorico(true)
    const { data, error } = await sb
      .from('comunicados_historico')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_envio', { ascending: false })
    
    if (data && !error) {
      setHistorico(data as ComunicadoHistorico[])
    }
    setLoadingHistorico(false)
  }, [tenantId, sb])

  useEffect(() => {
    fetchTemplates()
    fetchHistorico()
  }, [fetchTemplates, fetchHistorico])

  const criarTemplate = async (template: Partial<ComunicadoTemplate>) => {
    if (!tenantId) return { error: 'Sem tenant' }
    const { data, error } = await sb
      .from('comunicados_templates')
      .insert({ ...template, tenant_id: tenantId })
      .select()
      .single()
    if (!error) fetchTemplates()
    return { data, error }
  }

  const editarTemplate = async (id: string, updates: Partial<ComunicadoTemplate>) => {
    const { data, error } = await sb
      .from('comunicados_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) fetchTemplates()
    return { data, error }
  }

  const excluirTemplate = async (id: string) => {
    const { error } = await sb
      .from('comunicados_templates')
      .delete()
      .eq('id', id)
    if (!error) fetchTemplates()
    return { error }
  }

  const registrarEnvio = async (envio: Partial<ComunicadoHistorico>) => {
    if (!tenantId) return { error: 'Sem tenant' }
    const { data, error } = await sb
      .from('comunicados_historico')
      .insert({ ...envio, tenant_id: tenantId })
      .select()
      .single()
    if (!error) fetchHistorico()
    return { data, error }
  }
  const atualizarStatusEmMassa = async (ids: string[], novoStatus: string) => {
    if (!tenantId || !ids.length) return { error: 'Sem tenant ou ids' }
    const { data, error } = await sb
      .from('comunicados_historico')
      .update({ status: novoStatus })
      .in('id', ids)
      .select()
    if (!error) fetchHistorico()
    return { data, error }
  }

  return {
    templates,
    historico,
    loadingTemplates,
    loadingHistorico,
    fetchTemplates,
    fetchHistorico,
    criarTemplate,
    editarTemplate,
    excluirTemplate,
    registrarEnvio,
    atualizarStatusEmMassa
  }
}
