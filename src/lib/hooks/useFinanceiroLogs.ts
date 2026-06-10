'use client'
import { useState, useCallback, useEffect } from 'react'
import { getFinanceiroLogsAction, registrarLogFinanceiroAction } from '@/features/financeiro/actions/logActions'

export function useFinanceiroLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async (filters?: { startDate?: string, endDate?: string }) => {
    setLoading(true)
    const res = await getFinanceiroLogsAction(filters || {})
    if (res.success) {
      setLogs(res.data || [])
    }
    setLoading(false)
  }, [])

  const logAction = async (acao: string, detalhes: string) => {
    const res = await registrarLogFinanceiroAction(acao, detalhes)
    if (res.success) {
      fetchLogs()
    }
    return res
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, loading, fetchLogs, logAction }
}
