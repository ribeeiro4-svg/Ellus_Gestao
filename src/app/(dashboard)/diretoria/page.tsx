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
  Briefcase,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft
} from 'lucide-react'
import { useDiretoria, Diretor } from '@/lib/hooks/useDiretoria'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import KpiCard from '@/components/ui/KpiCard'
import { fmtR, fmtData } from '@/lib/utils/formatters'

export default function DiretoriaPage() {
  const { diretoria, loading, inserir, atualizar, remover } = useDiretoria()
  const { lancamentos } = useFinanceiro()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ledgerMember, setLedgerMember] = useState<Diretor | null>(null)
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
          <button onClick={() => setLedgerMember(i)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors" title="Extrato de Conta Corrente (Retiradas / Reembolsos)">
            <ReceiptText size={14} />
          </button>
          <button onClick={() => { setEditingItem(i); setIsModalOpen(true) }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleExcluir(i.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors" title="Remover">
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

      {/* Extrato do Membro (Conta Corrente / Ledger) */}
      {ledgerMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><ArrowRightLeft className="text-indigo-600" /> Extrato Financeiro</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{ledgerMember.nome} ({ledgerMember.cargo})</p>
              </div>
              <button onClick={() => setLedgerMember(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              {(() => {
                const myDocs = lancamentos.filter(l => l.diretor_id === ledgerMember.id && l.status === 'pago')
                const entradas = myDocs.filter(l => l.tipo === 'receita').reduce((s, a) => s + a.valor, 0)
                const retiradas = myDocs.filter(l => l.tipo === 'despesa').reduce((s, a) => s + a.valor, 0)
                const isWarning = retiradas > entradas

                return (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-3xl border border-emerald-100 text-center shadow-sm">
                        <TrendingUp size={20} className="text-emerald-500 mx-auto mb-2" />
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reembolsou</span>
                        <span className="text-sm font-black text-emerald-600">{fmtR(entradas)}</span>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border border-rose-100 text-center shadow-sm">
                        <TrendingDown size={20} className="text-rose-500 mx-auto mb-2" />
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Retirou / Sacou</span>
                        <span className="text-sm font-black text-rose-600">{fmtR(retiradas)}</span>
                      </div>
                      <div className={`bg-white p-4 col-span-2 md:col-span-1 rounded-3xl border text-center shadow-sm ${isWarning ? 'border-orange-200' : 'border-indigo-100'}`}>
                        <Briefcase size={20} className={`${isWarning ? 'text-orange-500' : 'text-indigo-500'} mx-auto mb-2`} />
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo (Devendo)</span>
                        <span className={`text-sm font-black ${isWarning ? 'text-orange-600' : 'text-indigo-600'}`}>{fmtR(Math.abs(entradas - retiradas))}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                      <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-widest">Histórico de Transações</div>
                      <ul className="divide-y divide-gray-50">
                        {myDocs.length === 0 ? (
                          <li className="p-8 text-center text-gray-400 font-medium text-xs">Nenhuma movimentação associada a este diretor foi encontrada no financeiro.</li>
                        ) : myDocs.map(l => (
                          <li key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="text-xs font-bold text-gray-900">{l.descricao}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{fmtData(l.data)} • {l.categoria}</div>
                            </div>
                            <div className={`text-xs font-black p-2 rounded-xl border ${l.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {l.tipo === 'receita' ? '+' : '-'}{fmtR(l.valor)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[32px]">
               <p className="text-[10px] text-center text-gray-400 font-medium tracking-wide">Lançamentos em aberto (pendentes) não entram no cálculo do saldo, apenas liquidados.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
