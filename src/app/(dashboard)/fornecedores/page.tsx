'use client'
import React, { useMemo, useState } from 'react'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import { Plus, Mail, Phone, Trash2, Search, Filter, HardDrive, ShoppingCart } from 'lucide-react'

export default function FornecedoresPage() {
  const { fornecedores, loading, inserir, atualizar, excluir } = useFornecedores()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('todas')

  const categorias = useMemo(() => {
    return [...new Set(fornecedores.map(f => f.categoria_padrao || 'GERAL'))].sort()
  }, [fornecedores])

  const filtrados = useMemo(() => {
    let res = fornecedores
    
    if (searchQ) {
      const q = searchQ.toLowerCase()
      res = res.filter(f => 
        f.nome.toLowerCase().includes(q) || 
        (f.cpf_cnpj && f.cpf_cnpj.includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q))
      )
    }

    if (filterCategory !== 'todas') {
      res = res.filter(f => (f.categoria_padrao || 'GERAL') === filterCategory)
    }

    return res
  }, [fornecedores, searchQ, filterCategory])

  const handleSalvar = async (data: any) => {
    try {
      const res = editingItem 
        ? await atualizar(editingItem.id, data)
        : await inserir({ ...data, status: 'ativo' })

      if (res?.error) {
        const errorMsg = typeof res.error === 'object' ? (res.error as any).message : String(res.error)
        alert(`Erro ao salvar: ${errorMsg}\n\nCERTIFIQUE-SE DE QUE CRIOU A TABELA NO SUPABASE!`)
      } else {
        setIsModalOpen(false)
        setEditingItem(null)
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return
    const res = await excluir(id)
    if (res?.error) {
      alert(`Erro ao excluir: ${(res.error as any).message}`)
    }
  }

  const columns = [
    {
      header: 'Fornecedor / Prestador', key: 'nome',
      render: (i: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold border border-orange-100 shadow-sm">
            {(i.nome || 'F')[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">{i.nome}</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{i.categoria_padrao || 'GERAL'}</span>
          </div>
        </div>
      )
    },
    { header: 'CPF/CNPJ', key: 'cpf_cnpj', render: (i: any) => <span className="text-xs font-semibold text-slate-500">{i.cpf_cnpj || 'Não informado'}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="associado" /> },
    {
      header: 'Contato', key: 'id',
      render: (i: any) => (
        <div className="flex items-center gap-2">
          {i.email && (
            <a href={`mailto:${i.email}`} title={i.email} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-600 hover:text-white transition-all">
              <Mail size={14} />
            </a>
          )}
          {i.telefone && (
            <a href={`https://wa.me/${i.telefone.replace(/\D/g, '')}`} target="_blank" title={i.telefone} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all">
              <Phone size={14} />
            </a>
          )}
        </div>
      )
    },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => { setEditingItem(i); setIsModalOpen(true) }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleExcluir(i.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-orange-500" />
            Fornecedores e Prestadores
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Gerencie quem presta serviços para facilitar a conciliação de saídas.</p>
        </div>
        
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-200 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Novo Fornecedor
        </button>
      </div>

      {/* Estatísticas Simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
             <HardDrive size={20} />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-800">{fornecedores.length}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cadastrado</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-800 font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none text-slate-600 focus:ring-2 focus:ring-orange-500 transition-all"
        >
          <option value="todas">TODAS CATEGORIAS</option>
          {categorias.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
        </select>
        { (searchQ || filterCategory !== 'todas') && (
          <button onClick={() => { setSearchQ(''); setFilterCategory('todas') }} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Limpar Filtros</button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filtrados} 
          loading={loading}
        />
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome / Razão Social', type: 'text', required: true },
          { name: 'cpf_cnpj', label: 'CPF ou CNPJ', type: 'text' },
          { name: 'email', label: 'E-mail', type: 'text' },
          { name: 'telefone', label: 'Telefone / WhatsApp', type: 'text' },
          { name: 'categoria_padrao', label: 'Categoria de Despesa (ex: Energia, Aluguel, Serviços)', type: 'text' },
        ]}
      />
    </div>
  )
}
