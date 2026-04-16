'use client'
import React from 'react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { Plus, Search, Filter } from 'lucide-react'

export default function FinanceiroPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<any>(null)

  const handleSalvar = async (data: any) => {
    if (editingItem) {
      await atualizar(editingItem.id, data)
    } else {
      await inserir({ ...data, status: data.status || 'aberto' })
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      await remover(id)
    }
  }

  const columns = [
    { 
      header: 'Data', 
      key: 'data', 
      render: (i: any) => <span className="text-sm font-medium text-slate-700">{fmtData(i.data)}</span> 
    },
    { 
      header: 'Descrição', 
      key: 'descricao', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{i.descricao}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{i.categoria}</span>
        </div>
      )
    },
    { 
      header: 'Valor', 
      key: 'valor', 
      render: (i: any) => (
        <span className={`text-sm font-black ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
          {i.tipo === 'receita' ? '+' : '-'} {fmtR(i.valor)}
        </span>
      )
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> 
    },
    { 
      header: 'Pagamento', 
      key: 'forma_pagamento', 
      render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> 
    },
    {
      header: '',
      key: 'acoes',
      className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fluxo de Caixa</h2>
          <p className="text-slate-500 text-sm mt-1">Gestão detalhada de todos os lançamentos financeiros.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 transition-all shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou categoria..." 
            className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={16} />
          <span>Filtros</span>
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={lancamentos} 
        loading={loading}
      />

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'receita', label: 'Receita (Entrada)' },
            { value: 'despesa', label: 'Despesa (Saída)' }
          ]},
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'text', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Pago/Recebido' },
            { value: 'aberto', label: 'Aberto/Pendente' },
            { value: 'atrasado', label: 'Atrasado' }
          ]},
          { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', required: false, options: [
            { value: 'Dinheiro', label: 'Dinheiro' },
            { value: 'PIX', label: 'PIX' },
            { value: 'Boleto', label: 'Boleto' },
            { value: 'Transferência', label: 'Transferência' },
            { value: 'Cartão', label: 'Cartão' }
          ]}
        ]}
      />
    </div>
  )
}
