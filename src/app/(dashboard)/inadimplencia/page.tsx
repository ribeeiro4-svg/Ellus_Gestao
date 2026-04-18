'use client'
import React, { useMemo, useState } from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, fmtPct } from '@/lib/utils/formatters'
import { AlertTriangle, TrendingDown, Users, ShieldAlert, Pencil, XCircle, Search, RefreshCw } from 'lucide-react'
import { 
  Chart as ChartJS, 
  ArcElement, Tooltip, Legend, 
  DoughnutController 
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import { useContas } from '@/lib/hooks/useContas'

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)

export default function InadimplenciaPage() {
  const { associados, loading: loadAssoc } = useAssociados()
  const { lancamentos, loading: loadFin, atualizar, remover } = useFinanceiro()
  const { contas } = useContas()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Associados inadimplentes (resumo)
  const inadimpAssocs = useMemo(() => 
    associados.filter(a => (a.status || '').toLowerCase().includes('inadimp')), 
  [associados])

  // Lançamentos atrasados (detalhado)
  const lancamentosAtrasados = useMemo(() => {
    return lancamentos.filter(l => 
        l.status === 'atrasado' || 
        (l.status === 'aberto' && new Date(l.data) < new Date())
    ).filter(l => {
        const searchLower = searchTerm.toLowerCase()
        const assoc = associados.find(a => a.id === l.associado_id)
        return !searchTerm || 
               l.descricao.toLowerCase().includes(searchLower) ||
               assoc?.nome.toLowerCase().includes(searchLower)
    })
  }, [lancamentos, searchTerm, associados])

  // Cálculos
  const totalDevido = useMemo(() => 
    lancamentosAtrasados.reduce((acc, l) => acc + (l.valor || 0), 0),
  [lancamentosAtrasados])

  const ticketMedioAtraso = inadimpAssocs.length > 0 ? totalDevido / inadimpAssocs.length : 0
  const pctInadimpTotal = (inadimpAssocs.length / (associados.length || 1)) * 100

  // Curva de atraso
  const curva = useMemo(() => {
    let m1 = 0, m2 = 0, m3 = 0, m3plus = 0
    inadimpAssocs.forEach(a => {
      const ms = a.meses_atraso || 0
      if (ms === 1) m1++
      else if (ms === 2) m2++
      else if (ms === 3) m3++
      else if (ms > 3) m3plus++
    })
    return [m1, m2, m3, m3plus]
  }, [inadimpAssocs])

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (id: string) => { if (confirm('Excluir este lançamento?')) await remover(id) }

  const handleSalvar = async (data: any) => {
    if (editingItem) await atualizar(editingItem.id, data)
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const modalFields: Field[] = useMemo(() => [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'data', label: 'Vencimento', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Recebido / Pago' }, { value: 'aberto', label: 'Aguardando' }, { value: 'atrasado', label: 'Em Atraso' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'text', required: true },
    { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] },
  ], [contas])

  const columns = [
    { 
      header: 'Associado / Descrição', 
      key: 'descricao', 
      render: (i: any) => {
        const assoc = associados.find(a => a.id === i.associado_id)
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{assoc?.nome || i.descricao}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{i.categoria} — Ref: {fmtData(i.data)}</span>
          </div>
        )
      }
    },
    { 
      header: 'Vencimento', 
      key: 'data', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-rose-500">{fmtData(i.data)}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Vencido</span>
        </div>
      )
    },
    { 
      header: 'Valor', 
      key: 'valor', 
      render: (i: any) => <span className="text-sm font-black text-red-600">{fmtR(i.valor)}</span>
    },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    { 
      header: '', key: 'acoes', className: 'w-20 text-right', 
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} title="Editar Lançamento" className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(i.id)} title="Excluir" className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <XCircle size={14} />
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="page-title">Painel de Inadimplência</div>
            <div className="page-subtitle">Controle detalhado de recebíveis vencidos e atrasados</div>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Vencido', value: fmtR(totalDevido), sub: `${lancamentosAtrasados.length} lançamentos pendentes`, icon: ShieldAlert, color: 'var(--red)' },
          { label: 'Indíce Geral', value: fmtPct(pctInadimpTotal), sub: 'da carteira de associados', icon: TrendingDown, color: 'var(--orange)' },
          { label: 'Ticket Médio', value: fmtR(ticketMedioAtraso), sub: 'por inadimplente', icon: Users, color: 'var(--text2)' },
          { label: 'Críticos (3+ Meses)', value: curva[3], sub: 'casos de alta inadimplência', icon: AlertTriangle, color: 'var(--red)' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: k.color }}>{k.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">{k.sub}</p>
            </div>
            <k.icon size={40} className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform" />
          </div>
        ))}
      </div>

      {/* ── Gráfico e Alerta ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="Curva de Atraso" subtitle="Distribuição por meses vencidos">
            <div className="h-[240px] mt-4">
              <Doughnut 
                data={{
                  labels: ['1 Mês', '2 Meses', '3 Meses', '3+ Meses'],
                  datasets: [{
                    data: curva,
                    backgroundColor: ['#fcd34d', '#fb923c', '#ef4444', '#991b1b'],
                    borderWidth: 0,
                    hoverOffset: 10
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 15 } }
                  },
                  cutout: '75%'
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
               <ShieldAlert size={16} className="text-red-500" /> Associados em Situação Crítica
            </h4>
            <div className="flex-1 space-y-4">
               {inadimpAssocs.sort((a,b) => (a.meses_atraso || 0) - (b.meses_atraso || 0)).slice(0, 3).map((a, idx) => (
                 <div key={a.id} className="flex items-center justify-between p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-red-200">#{idx+1}</span>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{a.nome}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{a.meses_atraso} meses em aberto</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-red-600">{fmtR(a.mensalidade * (a.meses_atraso || 0))}</p>
                       <button className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Acionar Cobrança</button>
                    </div>
                 </div>
               ))}
               {inadimpAssocs.length === 0 && (
                 <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm">
                    Nenhum inadimplente encontrado. Parabéns!
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lançamentos em Atraso</h4>
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                    type="text" 
                    placeholder="Filtrar lançamentos..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 ring-red-50 transition-all font-medium"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <DataTable columns={columns} data={lancamentosAtrasados} loading={loadFin || loadAssoc} />
      </div>

      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Lançamento Vencido" initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
    </div>
  )
}
