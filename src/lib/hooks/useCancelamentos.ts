'use client'
import { useState, useEffect } from 'react'

export interface HistoricoCancelamento {
  id: string
  associado_id: string
  nome: string
  cpf: string
  data_solicitacao: string
  valor_pendente: number
  termo_url?: string
}

export function useCancelamentos() {
  const [historico, setHistorico] = useState<HistoricoCancelamento[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('@acprobec:cancelamentos')
    if (saved) {
      try {
        setHistorico(JSON.parse(saved))
      } catch (e) {
        console.error('Erro ao ler histórico de cancelamentos', e)
      }
    }
  }, [])

  const persistir = (lista: HistoricoCancelamento[]) => {
    setHistorico(lista)
    localStorage.setItem('@acprobec:cancelamentos', JSON.stringify(lista))
  }

  const registrarCancelamento = (dados: Omit<HistoricoCancelamento, 'id' | 'data_solicitacao'>) => {
    const novoRegistro: HistoricoCancelamento = {
      ...dados,
      id: crypto.randomUUID(),
      data_solicitacao: new Date().toISOString()
    }
    persistir([novoRegistro, ...historico])
  }

  const remover = (id: string) => {
    persistir(historico.filter(h => h.id !== id))
  }

  const removerBulk = (ids: string[]) => {
    persistir(historico.filter(h => !ids.includes(h.id)))
  }

  const atualizarPendencia = (id: string, novoValor: number) => {
    persistir(historico.map(h => h.id === id ? { ...h, valor_pendente: novoValor } : h))
  }

  return { historico, registrarCancelamento, remover, removerBulk, atualizarPendencia }
}
