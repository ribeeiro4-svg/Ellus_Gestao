import React from 'react'
import { PLANO_CONTAS_ITG2002, PlanoContasItem } from '../data/planoContasITG2002'

interface Props {
  value?: string
  onChange: (item: PlanoContasItem) => void
  tipo?: 'ingresso' | 'dispesa' | 'ativo' | 'passivo' | 'patrimonio'
}

export default function ContaContabilSelect({ value, onChange, tipo }: Props) {
  const filtered = React.useMemo(() => {
    return PLANO_CONTAS_ITG2002.filter(item => {
      if (item.tipo !== 'analitica') return false
      if (!tipo) return true
      if (tipo === 'ingresso') return item.classificacao === 'ingresso'
      if (tipo === 'dispesa') return item.classificacao === 'despesa'
      return item.classificacao === tipo
    })
  }, [tipo])

  return (
    <select 
      value={value}
      onChange={(e) => {
        const item = filtered.find(i => i.codigo === e.target.value)
        if (item) onChange(item)
      }}
      className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#2d8c6f]/30 transition-all outline-none"
    >
      <option value="">Selecione uma conta contábil...</option>
      {filtered.map(item => (
        <option key={item.codigo} value={item.codigo}>
          {item.codigo} — {item.descricao}
        </option>
      ))}
    </select>
  )
}
