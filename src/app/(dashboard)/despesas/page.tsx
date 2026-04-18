'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingDown, Plus, RefreshCw, Copy, Search, Filter, XCircle, AlertCircle, TrendingUp } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#e07b39', '#f59e0b', '#c084fc', '#22d3ee', '#2d8c6f', '#34d399', '#f43f5e']

const axisDefaults = {
  y: {
    grid: { color: 'rgba(0,0,0,.04)' },
    ticks: { font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function DespesasPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()
  const { contas } = useContas()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  
  const despesas = useMemo(() => lancamentos.filter(l => l.tipo === 'despesa'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  const filteredDespesas = useMemo(() => {
    return despesas.filter(d => {
      const dt = new Date(d.data)
      const matchMonth = filterMonth === -1 || dt.getMonth() === filterMonth
      const matchYear = dt.getFullYear() === filterYear
      
      const searchLower = searchTerm.toLowerCase()
      const fornecedor = fornecedores.find(f => f.id === d.fornecedor_id)
      const conta = contas.find(c => c.id === d.conta_id)
      
      const matchSearch = !searchTerm || 
        d.descricao.toLowerCase().includes(searchLower) ||
        fornecedor?.nome.toLowerCase().includes(searchLower) ||
        conta?.nome.toLowerCase().includes(searchLower) ||
        d.categoria.toLowerCase().includes(searchLower)
      
      const matchStatus = filterStatus === 'todos' || d.status === filterStatus
      const matchPagamento = filterPagamento === 'todos' || d.forma_pagamento === filterPagamento
      const matchUnlinked = !onlyUnlinked || (!d.fornecedor_id && !d.diretor_id)

      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchUnlinked
    })
  }, [despesas, searchTerm, filterStatus, filterPagamento, filterMonth, filterYear, onlyUnlinked, fornecedores, contas])

  /* ── Dados para gráficos (baseados no filtro) ── */
  const despesaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    filteredDespesas.forEach(d => {
      const m = new Date(d.data).getMonth()
      if (!isNaN(m)) arr[m] += d.valor || 0
    })
    return arr
  }, [filteredDespesas])

  const despesaCats = useMemo(() => {
    const m: Record<string, number> = {}
    filteredDespesas.forEach(d => { const c = d.categoria || 'Outros'; m[c] = (m[c] || 0) + (d.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [filteredDespesas])

  const totalDespesas = filteredDespesas.reduce((s, d) => s + (d.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    const safeData = {
      ...data,
      fornecedor_id: data.fornecedor_id || null,
      diretor_id: data.diretor_id || null,
      conta_id: data.conta_id || null
    }
    if (editingItem) { await atualizar(editingItem.id, safeData) }
    else { await inserir({ ...safeData, tipo: 'despesa', status: safeData.status || 'aberto' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => {
    const { id, ...rest } = item
    setEditingItem(rest)
    setIsModalOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta despesa?')) await remover(id)
  }

  /* ── Colunas da tabela ── */
  const columns = [
    { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>
            {i.banco_transacao_id && (
              <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 shadow-sm uppercase tracking-tighter">
                <RefreshCw size={8} /> OFX
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span>
        </div>
      )
    },
    { header: 'Valor', key: 'valor', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--red)' }}>-{fmtR(i.valor)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
          </button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="page-title">Despesas</div>
            <div className="page-subtitle">Saídas financeiras — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>-{fmtR(totalDespesas)}</div>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn" style={{ background: 'var(--red)', color: '#fff', padding: '10px 20px', fontSize: 13, borderRadius: 'var(--radius-sm)', boxShadow: '0 2px 8px rgba(239,68,68,.35)' }}>
            <Plus size={16} /> Nova Despesa
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Despesas por Mês" subtitle="Evolução mensal das saídas">
          <Bar
            data={{
              labels: MESES,
              datasets: [{
                label: 'Despesa',
                data: despesaMensal,
                backgroundColor: 'rgba(224,123,57,.72)',
                borderRadius: 5,
                borderSkipped: false,
              }]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: axisDefaults,
            }}
          />
        </ChartCard>

        <ChartCard title="🍩 Mix por Categoria" subtitle="Distribuição das despesas">
          <Doughnut
            data={{
              labels: Object.keys(despesaCats),
              datasets: [{
                data: Object.values(despesaCats),
                backgroundColor: CHART_COLORS,
                hoverOffset: 6,
                borderWidth: 2,
                borderColor: '#fff',
              }]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              cutout: '65%',
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } }
              }
            }}
          />
        </ChartCard>
      </div>

      {/* ── BARRA DE PESQUISA E FILTROS ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative z-20">
        {/* Busca */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por descrição, fornecedor, conta ou categoria..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-red-300 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro Período (Mês e Ano Separados) */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <select 
            className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
          >
            <option value={-1}>Mês: Todos</option>
            {MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
          </select>
          <div className="w-[1px] h-3 bg-gray-300 mx-1" />
          <select 
            className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Filtro Sem Vínculo */}
        <button 
          onClick={() => setOnlyUnlinked(!onlyUnlinked)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${onlyUnlinked ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-amber-200'}`}
        >
          {onlyUnlinked ? <TrendingUp size={14} className="rotate-45" /> : <AlertCircle size={14} />} 
          SEM VÍNCULO
        </button>

        {/* Filtro Status */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <div className={`w-2 h-2 rounded-full ${filterStatus === 'todos' ? 'bg-gray-300' : 'bg-red-500'}`} />
          <select 
            className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="pago">Pago</option>
            <option value="aberto">Pendente</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        {/* Limpar */}
        {(searchTerm || filterStatus !== 'todos' || filterPagamento !== 'todos' || filterMonth !== -1 || onlyUnlinked) && (
          <button 
            onClick={() => { setSearchTerm(''); setFilterStatus('todos'); setFilterPagamento('todos'); setFilterMonth(new Date().getMonth()); setOnlyUnlinked(false) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <XCircle size={14} /> Limpar
          </button>
        )}
      </div>

      {/* ── Tabela ── */}
      <DataTable columns={columns} data={filteredDespesas} loading={loading} />

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Despesa' : 'Nova Despesa'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Folha', label: 'Folha de Pagamento' },
            { value: 'Impostos', label: 'Impostos e Taxas' },
            { value: 'Infraestrutura', label: 'Infraestrutura' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Eventos', label: 'Eventos / Palestras' },
            { value: 'Suprimentos', label: 'Suprimentos / Outros' },
          ]},
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Pago' },
            { value: 'aberto', label: 'Aberto / Pendente' },
            { value: 'atrasado', label: 'Atrasado' },
          ]},
          { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: [
            { value: 'Dinheiro', label: 'Dinheiro' },
            { value: 'PIX', label: 'PIX' },
            { value: 'Boleto', label: 'Boleto' },
            { value: 'Transferência', label: 'Transferência' },
            { value: 'Cartão', label: 'Cartão' },
          ]},
          { name: 'fornecedor_id', label: 'Fornecedor', type: 'select', options: [{ value: '', label: 'Nenhum' }, ...fornecedores.map(f => ({ value: f.id, label: f.nome }))] },
          { name: 'diretor_id', label: 'Membro Diretoria', type: 'select', options: [{ value: '', label: 'Nenhum' }, ...diretoria.map(d => ({ value: d.id, label: `${d.nome} (${d.cargo})` }))] },
        ]}
      />
    </div>
  )
}
