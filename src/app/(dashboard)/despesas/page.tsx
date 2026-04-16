'use client'
import React from 'react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { TrendingDown } from 'lucide-react'

export default function DespesasPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()
  const despesas = lancamentos.filter(l => l.tipo === 'despesa')

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<any>(null)

  const handleSalvar = async (data: any) => {
    if (editingItem) {
      await atualizar(editingItem.id, data)
    } else {
      await inserir({ ...data, tipo: 'despesa', status: data.status || 'aberto' })
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
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
      render: (i: any) => <span className="text-sm font-black text-red-600"> {fmtR(i.valor)}</span>
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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm border border-red-100">
            <TrendingDown size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Despesas</h2>
            <p className="text-slate-500 text-sm mt-1">Consulte e gerencie todas as saídas financeiras.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Total Pago</span>
            <span className="text-lg font-black text-red-600">{fmtR(despesas.reduce((acc, l) => acc + l.valor, 0))}</span>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
            className="h-14 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nova Despesa
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={despesas} loading={loading} />

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Despesa' : 'Nova Despesa'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'descricao', label: 'Descrição da Despesa', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data de Vencimento/Pagamento', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Folha', label: 'Folha de Pagamento' },
            { value: 'Impostos', label: 'Impostos e Taxas' },
            { value: 'Infraestrutura', label: 'Infraestrutura (Aluguel, Luz, Internet)' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Eventos', label: 'Eventos/Palestras' },
            { value: 'Suprimentos', label: 'Suprimentos / Outros' }
          ]},
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Pago' },
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
