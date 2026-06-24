'use client'
import React from 'react'
import { usePlanoContas } from '../hooks/usePlanoContas'

interface Props {
  value?: string
  currentLabel?: string  // nome/descrição do mapeamento já salvo (para fallback visual)
  onChange: (item: { codigo: string; descricao: string; classificacao: string }) => void
  tipo?: 'ingresso' | 'despesa' | 'ativo' | 'passivo' | 'patrimonio'
}

export default function ContaContabilSelect({ value, currentLabel, onChange, tipo }: Props) {
  const plano = usePlanoContas()

  const filtered = React.useMemo(() => {
    // Sem filtro de tipo: mostra todas as analíticas
    const analiticas = plano.contasAnaliticas
    if (!tipo) return analiticas
    if (tipo === 'ingresso') return analiticas.filter(c => c.classificacao === 'ingresso')
    if (tipo === 'despesa') return analiticas  // Dispêndio: mostra TODAS (qualquer grupo pode ser mapeado)
    return analiticas.filter(c => c.classificacao === tipo)
  }, [plano.contasAnaliticas, tipo])

  // Garante que o valor salvo sempre apareça como opção, mesmo fora do filtro
  const selectedInList = value ? filtered.some(c => c.codigo === value) : true
  const savedAccount = value && !selectedInList
    ? plano.contas.find(c => c.codigo === value)
    : null

  return (
    <select
      key={`${value}-${filtered.length}`}
      value={value ?? ''}
      onChange={(e) => {
        const item = plano.contas.find(i => i.codigo === e.target.value)
        if (item) onChange({ codigo: item.codigo, descricao: item.descricao, classificacao: item.classificacao })
      }}
      className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#2d8c6f]/30 transition-all outline-none"
    >
      <option value="">Selecione uma conta contábil...</option>
      {/* Opção de fallback: aparece se o valor salvo não está na lista filtrada */}
      {savedAccount && (
        <option value={savedAccount.codigo}>
          {savedAccount.codigo} — {savedAccount.descricao}
        </option>
      )}
      {/* Se nem no banco encontrou, usa o label salvo como fallback */}
      {value && !selectedInList && !savedAccount && currentLabel && (
        <option value={value}>{value} — {currentLabel}</option>
      )}
      {filtered.map(item => (
        <option key={item.id} value={item.codigo}>
          {item.codigo} — {item.descricao}
        </option>
      ))}
    </select>
  )
}
