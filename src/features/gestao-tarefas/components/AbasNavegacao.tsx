'use client'
import React from 'react'
import { LayoutGrid, List, BookOpen } from 'lucide-react'

type AbaID = 'kanban' | 'lista' | 'modelos'

interface AbasNavegacaoProps {
  ativa: AbaID
  onChange: (id: AbaID) => void
}

export default function AbasNavegacao({ ativa, onChange }: AbasNavegacaoProps) {
  const abas = [
    { id: 'kanban' as AbaID, label: 'Kanban', icon: LayoutGrid },
    { id: 'lista' as AbaID, label: 'Lista', icon: List },
    { id: 'modelos' as AbaID, label: 'Modelos & Resoluções', icon: BookOpen },
  ]

  return (
    <div className="bg-[#04140e]/60 p-1.5 rounded-[22px] flex flex-wrap items-center gap-1 border border-white/5 backdrop-blur-xl shadow-2xl">
      {abas.map((aba) => {
        const isActive = ativa === aba.id
        const Icon = aba.icon
        
        return (
          <button
            key={aba.id}
            onClick={() => onChange(aba.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500
              ${isActive 
                ? 'bg-white text-[#04140e] shadow-xl shadow-black/20 scale-105' 
                : 'text-emerald-500/40 hover:text-emerald-300 hover:bg-white/5'}
            `}
          >
            <Icon size={14} />
            {aba.label}
          </button>
        )
      })}
    </div>
  )
}
