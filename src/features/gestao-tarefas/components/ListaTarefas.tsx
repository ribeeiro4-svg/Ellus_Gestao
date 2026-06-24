'use client'
import React from 'react'
import { Tarefa, StatusTarefa } from '@/lib/types'
import DataTable from '@/components/ui/DataTable'
import { getPrioridadeColor } from '../utils/prioridade'
import { User, Calendar, Trash2, Edit } from 'lucide-react'

interface ListaTarefasProps {
  tarefas: Tarefa[]
  onEdit: (tarefa: Tarefa) => void
  onDelete: (id: string) => void
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
}

export default function ListaTarefas({ tarefas, onEdit, onDelete, selectedIds, onSelectChange }: ListaTarefasProps) {
  const columns = [
    {
      header: 'Título',
      key: 'titulo',
      className: 'min-w-[250px]',
      render: (t: Tarefa) => (
        <span className="text-sm font-bold text-slate-800 uppercase line-clamp-1">{t.titulo}</span>
      )
    },
    {
      header: 'Responsável',
      key: 'responsavel_nome',
      className: 'w-[180px]',
      render: (t: Tarefa) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={12} />
          </div>
          <span className="text-xs font-medium text-slate-600 truncate uppercase">{t.responsavel_nome}</span>
        </div>
      )
    },
    {
      header: 'Associado',
      key: 'associado_nome',
      className: 'w-[200px]',
      render: (t: Tarefa) => (
        <div className="flex items-center gap-2">
          {t.associado_nome ? (
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-tight border border-emerald-100/50">
              {t.associado_nome}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 uppercase italic">Nenhum</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      className: 'w-[150px]',
      render: (t: Tarefa) => {
        const colors: Record<StatusTarefa, string> = {
          'A Fazer': 'bg-slate-100 text-slate-500',
          'Em Andamento': 'bg-blue-100 text-blue-600',
          'Aguardando': 'bg-amber-100 text-amber-600',
          'Concluído': 'bg-emerald-100 text-emerald-600'
        }
        return (
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${colors[t.status]}`}>
            {t.status}
          </span>
        )
      }
    },
    {
      header: 'Prioridade',
      key: 'prioridade',
      className: 'w-[120px]',
      render: (t: Tarefa) => {
        const pColor = getPrioridadeColor(t.prioridade)
        return (
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${pColor.bg} ${pColor.text} ${pColor.border}`}>
            <div className={`w-1 h-1 rounded-full ${pColor.dot}`} />
            <span className="text-[9px] font-black uppercase tracking-wider">{t.prioridade}</span>
          </div>
        )
      }
    },
    {
      header: 'Prazo',
      key: 'prazo',
      className: 'w-[120px]',
      render: (t: Tarefa) => (
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Calendar size={14} />
          <span>{t.prazo ? new Date(t.prazo + 'T12:00:00Z').toLocaleDateString('pt-BR') : '--'}</span>
        </div>
      )
    },
    {
      header: 'Categoria',
      key: 'categoria',
      className: 'w-[120px]',
      render: (t: Tarefa) => (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.categoria || '--'}</span>
      )
    },
    {
      header: 'Ações',
      key: 'acoes',
      className: 'w-[100px] text-right',
      render: (t: Tarefa) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => onEdit(t)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(t.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DataTable
        columns={columns as any}
        data={tarefas}
        selectedIds={selectedIds}
        onSelectChange={onSelectChange}
        onRowClick={onEdit}
      />
    </div>
  )
}
