'use client'
import { useState, useMemo } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Trash2, 
  AlertCircle,
  Briefcase
} from 'lucide-react'
import { useDiretoria, Diretor } from '@/lib/hooks/useDiretoria'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import KpiCard from '@/components/ui/KpiCard'
import { fmtR } from '@/lib/utils/formatters'

export default function DiretoriaPage() {
  const { diretoria, loading, inserir, atualizar, remover } = useDiretoria()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Diretor | null>(null)
  const [searchQ, setSearchQ] = useState('')

  const handleSalvar = async (data: any) => {
    try {
      const res = editingItem 
        ? await atualizar(editingItem.id, data)
        : await inserir({ ...data, status: 'ativo' })

      if (res?.error) {
        alert(`Erro ao salvar: ${typeof res.error === 'object' ? (res.error as any).message : String(res.error)}`)
      } else {
        setIsModalOpen(false)
        setEditingItem(null)
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente remover este membro da diretoria?')) return
    const res = await remover(id)
    if (res?.error) alert(`Erro ao excluir: ${(res.error as any).message}`)
  }

  const filtrados = useMemo(() => {
    if (!searchQ) return diretoria
    const q = searchQ.toLowerCase()
    return diretoria.filter(d => 
      d.nome.toLowerCase().includes(q) || 
      d.cargo.toLowerCase().includes(q) ||
      (d.cpf && d.cpf.includes(q))
    )
  }, [diretoria, searchQ])

  const totalAtivos = diretoria.filter(d => d.status === 'ativo').length
  const totalCusto = diretoria.reduce((s, d) => s + (d.pro_labore_base || 0), 0)

  const columns = [
    {
      key: 'membro',
      header: 'Membro / Cargo',
      render: (i: Diretor) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {i.nome.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">{i.nome}</span>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{i.cargo}</span>
          </div>
        </div>
      )
    },
    {
      key: 'identificacao',
      header: 'Identificação',
      render: (i: Diretor) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-600">{i.cpf || '---'}</span>
          <span className="text-[10px] text-slate-400">CPF/CNPJ</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (i: Diretor) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          i.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'
        }`}>
          {i.status}
        </span>
      )
    },
    {
      key: 'pro_labore',
      header: 'Pro-labore',
      render: (i: Diretor) => (
        <span className="text-xs font-black text-slate-700">{fmtR(i.pro_labore_base || 0)}</span>
      )
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (i: Diretor) => (
        <div className="flex items-center gap-2">
          {i.email && <Mail size={14} className="text-slate-300" />}
          {i.telefone && <Phone size={14} className="text-slate-300" />}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (i: Diretor) => (
        <div className="flex items-center justify-end gap-2">
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" /> Gestão da Diretoria
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure os membros oficiais e seus respectivos pró-labores para simulações e termos.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Novo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Membros Ativos" value={totalAtivos} icon={<Users size={20} />} category="info" trendLabel="Diretores oficiais" />
        <KpiCard title="Custo Pró-labore" value={fmtR(totalCusto)} icon={<Briefcase size={20} />} category="info" trendLabel="Total mensal base" />
        <KpiCard title="Status do Conselho" value="Regular" icon={<ShieldCheck size={20} />} category="success" trendLabel="Diretoria vigente" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl mb-6 border border-slate-100">
          <Search size={18} className="text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Buscar por nome, cargo ou CPF..." 
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 w-full"
          />
        </div>

        <DataTable columns={columns} data={filtrados} loading={loading} />
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Diretor' : 'Novo Membro da Diretoria'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
          { name: 'cargo', label: 'Cargo Oficial', type: 'text', required: true, placeholder: 'Ex: Presidente, Diretor Financeiro...' },
          { name: 'cpf', label: 'CPF', type: 'text' },
          { name: 'pro_labore_base', label: 'Pró-labore Base (R$)', type: 'number' },
          { name: 'email', label: 'E-mail', type: 'text' },
          { name: 'telefone', label: 'Telefone/WhatsApp', type: 'text' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
          ]},
        ]}
      />
    </div>
  )
}
