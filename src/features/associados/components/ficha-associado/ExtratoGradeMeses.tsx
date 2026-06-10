import React from 'react'
import ExtratoMesCard from './ExtratoMesCard'

interface ExtratoGradeMesesProps {
  extrato: any[]
}

export default function ExtratoGradeMeses({ extrato }: ExtratoGradeMesesProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {extrato.map((m, i) => (
        <ExtratoMesCard 
          key={i}
          mes={m.mes}
          valor={m.valor}
          status={m.status}
        />
      ))}
    </div>
  )
}
