'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export function useConciliacaoLogs() {
  const tenantId = useTenantId()
  const [logsHistory, setLogsHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const sb = createClient()

  const fetchLogs = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('conciliacao_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('data_processamento', { ascending: false })
      
      if (error) throw error
      setLogsHistory(data || [])
    } catch (err) {
      console.error('Erro ao buscar histórico de conciliação:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  const saveLog = async (logs: any[]) => {
    if (!tenantId) return { error: 'Tenant ID não encontrado' }
    try {
      const { error } = await sb.from('conciliacao_logs').insert({
        tenant_id: tenantId,
        logs: logs
      })
      if (error) {
        console.error('Erro Supabase ao salvar log:', error)
        return { error: error.message }
      }
      fetchLogs()
      return { success: true }
    } catch (err: any) {
      console.error('Erro fatal ao salvar log:', err)
      return { error: err.message }
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logsHistory, loading, saveLog, refresh: fetchLogs }
}
