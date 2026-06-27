'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import { DEFAULT_MSG_COBRANCA, DEFAULT_MSG_HGU, DEFAULT_MSG_ADESAO } from '@/features/configuracoes/components/MensagensWhatsappTab'

export function useWhatsAppTemplates() {
  const tenantId = useTenantId()
  const sb = createClient()
  const [templates, setTemplates] = useState<{ cobranca: string; hgu: string; adesao?: string }>({
    cobranca: DEFAULT_MSG_COBRANCA,
    hgu: DEFAULT_MSG_HGU,
    adesao: DEFAULT_MSG_ADESAO
  })
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data, error } = await sb.from('cobranca_templates')
      .select('codigo, texto')
      .in('codigo', ['MSG_WHATSAPP_COBRANCA', 'MSG_WHATSAPP_HGU'])
      .eq('tenant_id', tenantId)

    if (data && data.length > 0) {
      const cobranca = data.find(d => d.codigo === 'MSG_WHATSAPP_COBRANCA')?.texto || DEFAULT_MSG_COBRANCA
      const hgu = data.find(d => d.codigo === 'MSG_WHATSAPP_HGU')?.texto || DEFAULT_MSG_HGU
      setTemplates({ cobranca, hgu })
    }
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  useEffect(() => {
    const handleRefresh = () => fetchTemplates()
    window.addEventListener('whatsapp-templates-updated', handleRefresh)
    return () => window.removeEventListener('whatsapp-templates-updated', handleRefresh)
  }, [fetchTemplates])

  const atualizar = async (codigo: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU', texto: string) => {
    if (!tenantId) return { error: 'Sem tenant' }
    
    // Check if exists
    const { data: existing } = await sb.from('cobranca_templates')
      .select('id')
      .eq('codigo', codigo)
      .eq('tenant_id', tenantId)
      .single()

    let error;
    if (existing) {
      const { error: err } = await sb.from('cobranca_templates')
        .update({ texto, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      error = err
    } else {
      const { error: err } = await sb.from('cobranca_templates')
        .insert({
          tenant_id: tenantId,
          codigo,
          etapa: 'manual',
          canal: 'whatsapp',
          tom: 'informal',
          titulo: codigo === 'MSG_WHATSAPP_COBRANCA' ? 'WhatsApp Cobrança Manual' : 'WhatsApp HGU Manual',
          texto,
          dias_min: 0,
          dias_max: 0
        })
      error = err
    }

    if (!error) {
      window.dispatchEvent(new Event('whatsapp-templates-updated'))
      fetchTemplates()
    } else {
      console.error(error)
    }
    return { error }
  }

  return { templates, loading, atualizar, refresh: fetchTemplates }
}
