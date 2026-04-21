'use client'
import React, { useState } from 'react'
import { useMetas } from '@/lib/hooks/useMetas'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import { fmtR, fmtData, pctMeta } from '@/lib/utils/formatters'
import { Target, Plus, User, Edit2, Trash2 } from 'lucide-react'

export default function MetasTab() {
  const { metas, loading, inserir, atualizar, remover } = useMetas()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta meta permanentemente?')) {
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
      header: 'Meta Estratégica', 
      key: 'meta', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-tight">{i.meta}</span>
          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
             <User size={10} />
             <span className="text-[10px] font-bold uppercase tracking-widest">{i.responsavel || 'Sem responsável'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Progresso Real / Meta', 
      key: 'progresso', 
      render: (i: any) => {
        const pct = pctMeta(i.valor_realizado, i.valor_meta)
        const isFinanceiro = i.unidade === 'R$'
        return (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex justify-between items-end">
               <span className="text-[10px] font-black text-slate-900">
                  {isFinanceiro ? fmtR(i.valor_realizado) : i.valor_realizado + (i.unidade || '')}
               </span>
               <span className="text-[10px] font-bold text-slate-300">
                  Alvo: {isFinanceiro ? fmtR(i.valor_meta) : i.valor_meta + (i.unidade || '')}
               </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-emerald-500 shadow-sm' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                style={{ width: `${Math.min(100, pct)}%` }}
              ></div>
            </div>
          </div>
        )
      }
    },
    { 
      header: 'Status', 
      key: 'pct', 
      render: (i: any) => {
        const pct = pctMeta(i.valor_realizado, i.valor_meta)
        return (
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${pct >= 100 ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'}`}>
             {pct}% Concluído
          </span>
        )
      }
    },
    { 
      header: 'Prazo', 
      key: 'prazo', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-600">{i.prazo ? fmtData(i.prazo) : 'Indeterminado'}</span>
        </div>
      )
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
            <Target className="text-orange-500" size={20} /> Metas e Performance
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Acompanhamento estratégico de objetivos e resultados.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Metas Atingidas</p>
                <h4 className="text-base font-black text-emerald-600 mt-1 leading-none">
                  {metas.filter(m => m.valor_realizado >= m.valor_meta && m.valor_meta > 0).length} / {metas.length}
                </h4>
              </div>
           </div>
           <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
             <Plus size={16} strokeWidth={3} /> Nova Meta
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
         <DataTable columns={columns} data={metas} loading={loading} />
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Meta' : 'Definir Nova Meta'}
        onSubmit={handleSave}
        initialData={editingItem}
        fields={[
          { name: 'meta', label: 'Nome da Meta', type: 'text', required: true },
          { name: 'responsavel', label: 'Responsável', type: 'text', required: true },
          { name: 'unidade', label: 'Unidade (R$, %, unid)', type: 'text', required: true },
          { name: 'valor_meta', label: 'Valor Alvo (Atingir)', type: 'number', required: true },
          { name: 'valor_realizado', label: 'Valor Realizado Atual', type: 'number', required: true },
          { name: 'prazo', label: 'Prazo Limite', type: 'date', required: true },
          { name: 'status', label: 'Status Inicial', type: 'select', required: true, options: [
            { value: 'em_andamento', label: 'Em Andamento' },
            { value: 'atingida', label: 'Atingida / Concluída' },
            { value: 'nao_iniciada', label: 'Não Iniciada' },
          ]},
        ]}
      />
    </div>
  )
}
