'use client'
import React from 'react'
import { Calendar, User, MessageSquare, Users } from 'lucide-react'
import { Tarefa } from '@/lib/types'
import { getPrioridadeColor } from '../utils/prioridade'

interface KanbanCardProps {
  tarefa: Tarefa
  onClick: (tarefa: Tarefa) => void
  onDragStart: (e: React.DragEvent, tarefaId: string) => void
}

export default function KanbanCard({ tarefa, onClick, onDragStart }: KanbanCardProps) {
  const pColor = getPrioridadeColor(tarefa.prioridade)
  
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, tarefa.id)}
      onClick={() => onClick(tarefa)}
      className="group bg-white p-5 rounded-2xl border border-white shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-200 transition-all duration-500 cursor-pointer active:scale-[0.98]"
    >
      <div className="flex flex-col gap-3">
        {/* Prioridade e Categoria */}
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${pColor.bg} ${pColor.text} ${pColor.border}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${pColor.dot} animate-pulse`} />
            <span className="text-[9px] font-black uppercase tracking-wider">{tarefa.prioridade}</span>
          </div>
          {tarefa.categoria && (
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{tarefa.categoria}</span>
          )}
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#0e2d22] transition-colors line-clamp-2 uppercase">
            {tarefa.titulo}
          </h3>
          {tarefa.descricao && (
            <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed">
              {tarefa.descricao}
            </p>
          )}
        </div>

        {/* Rodapé do Card */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
          <div className="flex items-center gap-3">
            {/* Responsável */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User size={10} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 max-w-[80px] truncate uppercase">
                {tarefa.responsavel_nome?.split(' ')[0]}
              </span>
            </div>
            
            {/* Prazo */}
            {tarefa.prazo && (
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar size={10} />
                <span className="text-[10px] font-medium">{new Date(tarefa.prazo + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            )}
          </div>

          {/* Associado */}
          {(tarefa.associado_nome || tarefa.associado_id) && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50/50 border border-emerald-100/50 text-emerald-700">
              <Users size={10} />
              <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-[120px]">
                {tarefa.associado_nome || "ID: " + tarefa.associado_id?.substring(0, 8)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-slate-300 group-hover:text-emerald-400 transition-colors">
            <MessageSquare size={12} />
          </div>
        </div>
      </div>
    </div>
  )
}
