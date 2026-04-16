'use client'
import React from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import { fmtR } from '@/lib/utils/formatters'
import { Plus, Search, Filter, Mail, Phone } from 'lucide-react'

export default function AssociadosPage() {
  const { associados, loading, inserir, atualizar, remover } = useAssociados()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<any>(null)

  const handleSalvar = async (data: any) => {
    if (editingItem) {
      await atualizar(editingItem.id, data)
    } else {
      await inserir({ ...data, status: data.status || 'ativo' })
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este associado? Todos os vínculos podem ser perdidos.')) {
      await remover(id)
    }
  }

  const columns = [
    { 
      header: 'Identificação', 
      key: 'nome', 
      render: (i: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shadow-sm shadow-blue-600/10">
            {i.nome?.[0] || 'A'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-tight">{i.nome}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{i.codigo}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Categoria', 
      key: 'categoria', 
      render: (i: any) => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{i.categoria}</span> 
    },
    { 
      header: 'Mensalidade', 
      key: 'mensalidade', 
      render: (i: any) => <span className="text-sm font-black text-slate-900">{fmtR(i.mensalidade)}</span> 
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (i: any) => <StatusBadge status={i.status} type="associado" /> 
    },
    { 
      header: 'Contato', 
      key: 'email', 
      render: (i: any) => (
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
          <span title={i.email}><Mail size={16} className="cursor-pointer" /></span>
          {i.telefone && <span title={i.telefone}><Phone size={16} className="cursor-pointer" /></span>}
        </div>
      )
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Associados</h2>
          <p className="text-slate-500 text-sm mt-1">Base completa de associados e controle de adimplência.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ativos</span>
            <span className="text-sm font-black text-emerald-600">{associados.filter(a => a.status === 'ativo').length}</span>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Novo Associado</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-3 focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600 transition-all shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, código ou email..." 
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
        data={associados} 
        loading={loading}
      />

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Associado' : 'Novo Associado'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome ou Razão Social', type: 'text', required: true },
          { name: 'codigo', label: 'Código (Matrícula)', type: 'text', required: true },
          { name: 'email', label: 'Email de Contato', type: 'text', required: true },
          { name: 'telefone', label: 'Telefone/WhatsApp', type: 'text', required: false },
          { name: 'mensalidade', label: 'Valor da Mensalidade (R$)', type: 'number', required: true },
          { name: 'data_ingresso', label: 'Data de Ingresso', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Pleno', label: 'Pleno' },
            { value: 'Premium', label: 'Premium' },
            { value: 'Corporativo', label: 'Corporativo' },
            { value: 'Estudante', label: 'Estudante' },
            { value: 'Isento', label: 'Isento' }
          ]},
          { name: 'status', label: 'Status Inicial', type: 'select', required: true, options: [
            { value: 'ativo', label: 'Ativo (Adimplente)' },
            { value: 'inadimplente', label: 'Inadimplente' },
            { value: 'inativo', label: 'Inativo' }
          ]}
        ]}
      />
    </div>
  )
}

