import React from 'react'
import { X, User } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

interface FichaAssociadoHeaderProps {
  nome: string
  status: string
  onClose: () => void
}

export default function FichaAssociadoHeader({ nome, status, onClose }: FichaAssociadoHeaderProps) {
  return (
    <div className="relative h-40 bg-gradient-to-br from-[#0e2d22] to-[#163d2f] p-8 flex items-end overflow-hidden">
      {/* Decoração de Fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-10 -mb-10 blur-2xl" />

      <div className="relative flex items-center gap-6 w-full">
        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-3xl font-black shadow-2xl shrink-0">
          {(nome || 'A')[0]}
        </div>
        
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-2xl lg:text-3xl font-black tracking-tight uppercase leading-none">
              {nome}
            </h2>
            <div className="scale-90 origin-left">
              <StatusBadge status={status} type="associado" />
            </div>
          </div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[3px] opacity-80 flex items-center gap-2">
            <User size={12} /> Ficha Detalhada do Associado
          </p>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 backdrop-blur-md group"
      >
        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  )
}
