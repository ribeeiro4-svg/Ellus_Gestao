'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import { DEFAULT_MSG_COBRANCA, DEFAULT_MSG_HGU, DEFAULT_MSG_ADESAO } from '@/features/configuracoes/components/MensagensWhatsappTab'

const getHash = (str: string) => {
  let h = 0;
  for(let i=0; i<str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36).substring(0, 4).toUpperCase();
};

export function useWhatsAppTemplates() {
  const tenantId = useTenantId()
  const sb = createClient()
  const [templates, setTemplates] = useState<{ cobranca: string; hgu: string; adesao: string }>({
    cobranca: DEFAULT_MSG_COBRANCA,
    hgu: DEFAULT_MSG_HGU,
    adesao: DEFAULT_MSG_ADESAO
  })
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    
    const prefix = getHash(tenantId)
    const codeCob = `${prefix}_COB`
    const codeHgu = `${prefix}_HGU`
    const codeAde = `${prefix}_ADE`

    const { data, error } = await sb.from('cobranca_templates')
      .select('codigo, texto')
      .in('codigo', [codeCob, codeHgu, codeAde])
      .eq('tenant_id', tenantId)

    if (data) {
      const cobranca = data.find(d => d.codigo === codeCob)?.texto || DEFAULT_MSG_COBRANCA
      const hgu = data.find(d => d.codigo === codeHgu)?.texto || DEFAULT_MSG_HGU
      const adesao = data.find(d => d.codigo === codeAde)?.texto || DEFAULT_MSG_ADESAO
      setTemplates({ cobranca, hgu, adesao })
    }
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  useEffect(() => {
    const handleRefresh = () => fetchTemplates()
    window.addEventListener('whatsapp-templates-updated', handleRefresh)
    return () => window.removeEventListener('whatsapp-templates-updated', handleRefresh)
  }, [fetchTemplates])

  const atualizar = async (codigoReq: 'MSG_WHATSAPP_COBRANCA' | 'MSG_WHATSAPP_HGU' | 'MSG_WHATSAPP_ADESAO', texto: string) => {
    if (!tenantId) return { error: 'Sem tenant' }
    
    const prefix = getHash(tenantId)
    const codigo = codigoReq === 'MSG_WHATSAPP_COBRANCA' ? `${prefix}_COB` : codigoReq === 'MSG_WHATSAPP_HGU' ? `${prefix}_HGU` : `${prefix}_ADE`

    const { error } = await sb.from('cobranca_templates')
      .upsert({
        tenant_id: tenantId,
        codigo,
        etapa: 'manual',
        canal: 'whatsapp',
        tom: 'informal',
        titulo: codigoReq === 'MSG_WHATSAPP_COBRANCA' ? 'WhatsApp Cobrança Manual' : codigoReq === 'MSG_WHATSAPP_HGU' ? 'WhatsApp HGU Manual' : 'WhatsApp Adesão Manual',
        texto,
        dias_min: 0,
        dias_max: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'codigo' })

    if (!error) {
      window.dispatchEvent(new Event('whatsapp-templates-updated'))
      fetchTemplates()
    } else {
      console.error('Erro ao salvar template:', error)
    }
    return { error }
  }

  return { templates, loading, atualizar, refresh: fetchTemplates }
}
