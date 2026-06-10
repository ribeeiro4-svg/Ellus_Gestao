'use client'
import React from 'react'
import { StatusTarefa, Tarefa } from '@/lib/types'
import KanbanColuna from './KanbanColuna'

interface KanbanBoardProps {
  tarefas: Tarefa[]
  onAddClick: (status: StatusTarefa) => void
  onCardClick: (tarefa: Tarefa) => void
  onMoveTask: (tarefaId: string, novoStatus: StatusTarefa) => void
}

export default function KanbanBoard({ tarefas, onAddClick, onCardClick, onMoveTask }: KanbanBoardProps) {
  const colunas: StatusTarefa[] = ['A Fazer', 'Em Andamento', 'Aguardando', 'Concluído']

  const handleDrop = (e: React.DragEvent, targetStatus: StatusTarefa) => {
    e.preventDefault()
    const tarefaId = e.dataTransfer.getData('tarefaId')
    if (tarefaId) {
      onMoveTask(tarefaId, targetStatus)
    }
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
      {colunas.map((col) => (
        <KanbanColuna
          key={col}
          titulo={col}
          tarefas={tarefas.filter((t) => t.status === col)}
          onAddClick={onAddClick}
          onCardClick={onCardClick}
          onDrop={handleDrop}
        />
      ))}
    </div>
  )
}
