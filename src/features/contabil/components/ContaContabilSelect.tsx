'use client'
import React from 'react'
import { usePlanoContas } from '../hooks/usePlanoContas'

interface Props {
  value?: string
  onChange: (item: { codigo: string; descricao: string; classificacao: string }) => void
  tipo?: 'ingresso' | 'dispesa' | 'ativo' | 'passivo' | 'patrimonio'
}

export default function ContaContabilSelect({ value, onChange, tipo }: Props) {
  const plano = usePlanoContas()

  const filtered = React.useMemo(() => {
    const analiticas = plano.contasAnaliticas
    if (!tipo) return analiticas
    if (tipo === 'ingresso') return analiticas.filter(c => c.classificacao === 'ingresso')
    if (tipo === 'dispesa') return analiticas.filter(c =>
      c.classificacao === 'despesa' ||
      c.codigo.startsWith('4') ||
      c.codigo.startsWith('5')
    )
    return analiticas.filter(c => c.classificacao === tipo)
  }, [plano.contasAnaliticas, tipo])

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const item = filtered.find(i => i.codigo === e.target.value)
        if (item) onChange({ codigo: item.codigo, descricao: item.descricao, classificacao: item.classificacao })
      }}
      className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#2d8c6f]/30 transition-all outline-none"
    >
      <option value="">Selecione uma conta contábil...</option>
      {filtered.map(item => (
        <option key={item.id} value={item.codigo}>
          {item.codigo} — {item.descricao}
        </option>
      ))}
    </select>
  )
}
