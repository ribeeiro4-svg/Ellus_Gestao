'use client'
import React from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Tarefa, StatusTarefa } from '@/lib/types'
import KanbanCard from './KanbanCard'

interface KanbanColunaProps {
  titulo: StatusTarefa
  tarefas: Tarefa[]
  onAddClick: (status: StatusTarefa) => void
  onCardClick: (tarefa: Tarefa) => void
  onDrop: (e: React.DragEvent, targetStatus: StatusTarefa) => void
}

export default function KanbanColuna({ titulo, tarefas, onAddClick, onCardClick, onDrop }: KanbanColunaProps) {
  const [isOver, setIsOver] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(true)
  }

  const handleDragLeave = () => {
    setIsOver(false)
  }

  const handleDropLocal = (e: React.DragEvent) => {
    setIsOver(false)
    onDrop(e, titulo)
  }

  const handleDragStart = (e: React.DragEvent, tarefaId: string) => {
    e.dataTransfer.setData('tarefaId', tarefaId)
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropLocal}
      className={`flex flex-col flex-1 min-w-[300px] bg-emerald-900/5 backdrop-blur-md rounded-[32px] border transition-all duration-300 ${
        isOver ? 'border-emerald-400 bg-emerald-900/10 scale-[1.01]' : 'border-emerald-900/5'
      }`}
    >
      {/* Header da Coluna */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-black text-white uppercase tracking-[2px]">{titulo}</h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
            {tarefas.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onAddClick(titulo)}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[500px]">
        {tarefas.map((tarefa) => (
          <KanbanCard 
            key={tarefa.id} 
            tarefa={tarefa} 
            onClick={onCardClick}
            onDragStart={handleDragStart}
          />
        ))}

        {tarefas.length === 0 && !isOver && (
          <div className="h-24 border-2 border-dashed border-emerald-900/20 rounded-2xl flex items-center justify-center text-[10px] font-bold text-emerald-500/30 uppercase tracking-widest">
            Sem tarefas
          </div>
        )}
      </div>
    </div>
  )
}
