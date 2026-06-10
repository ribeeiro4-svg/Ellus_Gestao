'use client'
import { useCallback, useState, useEffect } from 'react'

export interface HistoricoAdesao {
  id: string
  nome_completo: string
  cpf: string
  telefone: string
  created_at: string
}

const STORAGE_KEY = 'historico_novos_associados'

function loadFromStorage(): HistoricoAdesao[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveToStorage(items: HistoricoAdesao[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useHistoricoAdesao() {
  const [historico, setHistorico] = useState<HistoricoAdesao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setHistorico(loadFromStorage())
    setLoading(false)
  }, [])

  const registrar = useCallback((input: {
    nome_completo: string
    cpf: string
    telefone: string
  }) => {
    const novo: HistoricoAdesao = {
      id: crypto.randomUUID(),
      ...input,
      created_at: new Date().toISOString(),
    }
    setHistorico(prev => {
      const updated = [novo, ...prev]
      saveToStorage(updated)
      return updated
    })
  }, [])

  const remover = useCallback((id: string) => {
    setHistorico(prev => {
      const updated = prev.filter(h => h.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const refresh = useCallback(() => {
    setHistorico(loadFromStorage())
  }, [])

  return { historico, loading, registrar, remover, refresh }
}
