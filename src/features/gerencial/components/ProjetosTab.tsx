'use client'
import React, { useState } from 'react'
import { useProjetos } from '@/lib/hooks/useProjetos'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { Briefcase, Calendar, DollarSign, Plus, Edit2, Trash2, User } from 'lucide-react'

export default function ProjetosTab() {
  const { projetos, loading, inserir, atualizar, remover } = useProjetos()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este projeto?')) {
      await remover(id)
    }
  }

  const handleSave = async (data: any) => {
    if (editingItem) {
      await atualizar(editingItem.id, data)
    } else {
      await inserir(data)
    }
    setIsModalOpen(false)
  }

  const columns = [
    { 
      header: 'Projeto / Iniciativa', 
      key: 'projeto', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-tight">{i.projeto}</span>
          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
             <User size={10} />
             <span className="text-[10px] font-bold uppercase tracking-widest">{i.responsavel}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Cronograma', 
      key: 'prazo', 
      render: (i: any) => (
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={13} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {i.data_inicio ? fmtData(i.data_inicio) : 'INÍCIO'} → {i.prazo ? fmtData(i.prazo) : 'FIM'}
          </span>
        </div>
      )
    },
    { 
      header: 'Execução Orçamentária', 
      key: 'orcamento', 
      render: (i: any) => {
        const pct = (i.gasto / i.orcamento) * 100 || 0
        return (
          <div className="flex flex-col min-w-[180px]">
            <div className="flex justify-between items-center mb-1.5">
               <span className="text-[10px] font-black text-slate-900">{fmtR(i.gasto)} <span className="text-slate-300">/ {fmtR(i.orcamento)}</span></span>
               <span className={`text-[10px] font-bold ${pct > 100 ? 'text-red-500' : 'text-slate-400'}`}>{Math.round(pct)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-orange-500' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min(100, pct)}%` }}
              ></div>
            </div>
          </div>
        )
      }
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (i: any) => {
        const s = i.status.toLowerCase()
        const colors: Record<string, string> = {
          'concluido': 'bg-emerald-50 text-emerald-700 border-emerald-100',
          'em_andamento': 'bg-blue-50 text-blue-700 border-blue-100',
          'atrasado': 'bg-red-50 text-red-700 border-red-100',
          'cancelado': 'bg-slate-200 text-slate-500 border-slate-300',
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[s] || 'bg-slate-50 text-slate-600'}`}>
            {i.status.replace('_', ' ')}
          </span>
        )
      }
    },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Briefcase className="text-indigo-600" size={20} /> Gestão de Projetos
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Acompanhamento de orçamentos e prazos de iniciativas.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={16} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Plano de Investimento</p>
                <h4 className="text-base font-black text-slate-900 leading-none mt-1">{fmtR(projetos.reduce((acc, p) => acc + p.orcamento, 0))}</h4>
              </div>
           </div>
           <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
             <Plus size={16} strokeWidth={3} /> Novo Projeto
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <DataTable columns={columns} data={projetos} loading={loading} />
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Projeto' : 'Novo Projeto'}
        onSubmit={handleSave}
        initialData={editingItem}
        fields={[
          { name: 'projeto', label: 'Nome do Projeto', type: 'text', required: true },
          { name: 'responsavel', label: 'Departamento / Pessoa', type: 'text', required: true },
          { name: 'orcamento', label: 'Orçamento Previsto (R$)', type: 'number', required: true },
          { name: 'gasto', label: 'Gasto Realizado (R$)', type: 'number', required: true },
          { name: 'data_inicio', label: 'Data Início', type: 'date', required: true },
          { name: 'prazo', label: 'Prazo Final', type: 'date', required: true },
          { name: 'status', label: 'Status Atual', type: 'select', required: true, options: [
            { value: 'planejado', label: 'Planejado' },
            { value: 'em_andamento', label: 'Em Andamento' },
            { value: 'concluido', label: 'Concluído' },
            { value: 'atrasado', label: 'Atrasado' },
            { value: 'cancelado', label: 'Cancelado' },
          ]},
        ]}
      />
    </div>
  )
}
