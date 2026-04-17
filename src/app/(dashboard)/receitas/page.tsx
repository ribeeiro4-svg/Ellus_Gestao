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
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingUp, Plus, RefreshCw, Copy, ChevronDown, ChevronRight, Search, Filter, XCircle, AlertCircle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#2d8c6f', '#34d399', '#f59e0b', '#e07b39', '#c084fc', '#22d3ee', '#f43f5e']

const axisDefaults = {
  y: {
    grid: { color: 'rgba(0,0,0,.04)' },
    ticks: { font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function ReceitasPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const receitas = useMemo(() => lancamentos.filter(l => l.tipo === 'receita'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['__all__']))

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  const filteredReceitas = useMemo(() => {
    return receitas.filter(r => {
      const d = new Date(r.data)
      const matchMonth = filterMonth === -1 || d.getMonth() === filterMonth
      const matchYear = d.getFullYear() === filterYear
      
      const searchLower = searchTerm.toLowerCase()
      const assoc = associados.find(a => a.id === r.associado_id)
      const conta = contas.find(c => c.id === r.conta_id)
      
      const matchSearch = !searchTerm || 
        r.descricao.toLowerCase().includes(searchLower) ||
        assoc?.nome.toLowerCase().includes(searchLower) ||
        conta?.nome.toLowerCase().includes(searchLower) ||
        r.categoria.toLowerCase().includes(searchLower)
      
      const matchStatus = filterStatus === 'todos' || r.status === filterStatus
      const matchPagamento = filterPagamento === 'todos' || r.forma_pagamento === filterPagamento
      const matchUnlinked = !onlyUnlinked || !r.associado_id

      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchUnlinked
    })
  }, [receitas, searchTerm, filterStatus, filterPagamento, filterMonth, filterYear, onlyUnlinked, associados, contas])

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const expandAll = () => {
    const keys = receitasPorAssociado ? [...receitasPorAssociado.keys()] : []
    setExpandedGroups(new Set(keys))
  }
  const collapseAll = () => setExpandedGroups(new Set())

  /* ── Dados para gráficos (baseados no filtro) ── */
  const receitaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    filteredReceitas.forEach(r => {
      const m = new Date(r.data).getMonth()
      if (!isNaN(m)) arr[m] += r.valor || 0
    })
    return arr
  }, [filteredReceitas])

  const receitaCats = useMemo(() => {
    const m: Record<string, number> = {}
    filteredReceitas.forEach(r => { const c = r.categoria || 'Outros'; m[c] = (m[c] || 0) + (r.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [filteredReceitas])

  const totalReceitas = filteredReceitas.reduce((s, r) => s + (r.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, tipo: 'receita', status: data.status || 'pago' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => {
    const { id, ...rest } = item
    setEditingItem(rest)
    setIsModalOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta receita?')) await remover(id)
  }

  /* ── Agrupamento por associado (baseado no filtro) ── */
  const receitasPorAssociado = useMemo(() => {
    const groups = new Map<string, { assoc: any; items: any[] }>()
    filteredReceitas.forEach(r => {
      const assoc = associados.find(a => a.id === r.associado_id)
      const key = r.associado_id || '__sem_assoc__'
      if (!groups.has(key)) groups.set(key, { assoc: assoc || null, items: [] })
      groups.get(key)!.items.push(r)
    })
    return new Map([...groups.entries()].sort(([ka, a], [kb, b]) => {
      if (ka === '__sem_assoc__') return 1
      if (kb === '__sem_assoc__') return -1
      const totalA = a.items.reduce((s: number, i: any) => s + (i.valor || 0), 0)
      const totalB = b.items.reduce((s: number, i: any) => s + (i.valor || 0), 0)
      return totalB - totalA
    }))
  }, [filteredReceitas, associados])

  /* ── Colunas da tabela ── */
  const columns = [
    { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>
            {i.recorrencia_ativa && (
              <span className="flex items-center gap-1 text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                <RefreshCw size={8} /> ↺ Recorrente
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span>
        </div>
      )
    },
    { 
      header: 'Conta', 
      key: 'conta_id', 
      render: (i: any) => {
        const conta = contas.find(c => c.id === i.conta_id)
        return (
          <div className="flex flex-col">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{conta?.nome || '—'}</span>
            <span style={{ fontSize: 8, color: 'var(--text3)', textTransform: 'uppercase' }}>{conta?.tipo.replace('_', ' ') || ''}</span>
          </div>
        )
      }
    },
    { 
      header: 'Associado', 
      key: 'associado_id', 
      render: (i: any) => {
        const assoc = associados.find(a => a.id === i.associado_id)
        if (assoc) return <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{assoc.nome}</span>
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase border border-amber-100 animate-pulse">
            <AlertCircle size={10} /> Sem Vínculo
          </span>
        )
      }
    },
    { header: 'Valor', key: 'valor', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>{fmtR(i.valor)}</span> },
    {
      header: 'Taxa Bancária', key: 'taxa_extraida', render: (i: any) => {
        const match = i.descricao.match(/\(Taxa: R\$\s*([^)]+)\)/)
        const taxaStr = match ? `R$ ${match[1]}` : 'R$ 0,00'
        return <span className={`text-[11px] font-black ${match ? 'text-amber-600' : 'text-gray-300'}`}>{taxaStr}</span>
      }
    },
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

  const handleFieldChange = (name: string, value: any, setFormData: any) => {
    // Regra 1: Se for Dinheiro, auto-seleciona a conta de Caixa
    if (name === 'forma_pagamento' && value === 'Dinheiro') {
      const contaCaixa = contas.find(c => 
        c.nome.toUpperCase().includes('CAIXA') || 
        c.nome.toUpperCase().includes('ESPÉCIE')
      )
      if (contaCaixa) {
        setFormData((prev: any) => ({ ...prev, conta_id: contaCaixa.id }))
      }
    }
    // Regra 2: Atalho para Adesão pela descrição ou pelo valor padrão (50)
    const isAdesao = value?.toString().toUpperCase().includes('ADESÃO')
    if (name === 'descricao' && isAdesao) {
      setFormData((prev: any) => ({ ...prev, categoria: 'ADESÃO' }))
    }
    if (name === 'valor' && value === 50 && !isAdesao) {
      // Se o valor for 50 e ainda não tiver categoria, sugere Mensalidades que é o mais comum
      setFormData((prev: any) => ({ ...prev, categoria: prev.categoria || 'Mensalidades' }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(45,140,111,.12)', border: '1px solid rgba(45,140,111,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="page-title">Receitas</div>
            <div className="page-subtitle">Entradas financeiras — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{fmtR(totalReceitas)}</div>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
            <Plus size={16} /> Nova Receita
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Receitas por Mês" subtitle="Evolução mensal das entradas">
          <Bar
            data={{
              labels: MESES,
              datasets: [{
                label: 'Receita',
                data: receitaMensal,
                backgroundColor: 'rgba(45,140,111,.72)',
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

        <ChartCard title="🍩 Mix por Categoria" subtitle="Distribuição das receitas">
          <Doughnut
            data={{
              labels: Object.keys(receitaCats),
              datasets: [{
                data: Object.values(receitaCats),
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
            placeholder="Buscar por descrição, associado, conta ou categoria..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-indigo-300 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro Status */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <div className={`w-2 h-2 rounded-full ${filterStatus === 'todos' ? 'bg-gray-300' : 'bg-green-500'}`} />
          <select 
            className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="pago">Pago / Recebido</option>
            <option value="pendente">Pendente</option>
          </select>
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

      {/* ── Agrupado por Associado ── */}
      <div className="table-card overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/40">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {receitasPorAssociado.size} por associado &bull; {filteredReceitas.length} lançamentos
          </span>
          <div className="flex items-center gap-3">
            <button onClick={expandAll} className="text-[10px] font-bold text-indigo-500 hover:underline transition-all">Expandir todos</button>
            <span className="text-gray-200">|</span>
            <button onClick={collapseAll} className="text-[10px] font-bold text-gray-400 hover:underline transition-all">Recolher todos</button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Carregando...</div>
        ) : filteredReceitas.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-400">
            {searchTerm || filterStatus !== 'todos' || filterPagamento !== 'todos' 
              ? 'Nenhum resultado para os filtros aplicados.' 
              : 'Nenhuma receita encontrada.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...receitasPorAssociado.entries()].map(([key, { assoc, items }]) => {
              const isOpen = expandedGroups.has(key)
              const total = items.reduce((s, i) => s + (i.valor || 0), 0)
              const initials = assoc ? assoc.nome.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() : '?'
              const label = assoc ? assoc.nome : 'Sem Associado'

              return (
                <div key={key}>
                  {/* ─ Cabeçalho do grupo (clicavel) ─ */}
                  <div
                    onClick={() => toggleGroup(key)}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none hover:bg-indigo-50/30 transition-all group"
                    style={{ background: isOpen ? 'rgba(79,126,248,.04)' : 'transparent' }}
                  >
                    {/* Chevron */}
                    <div className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: assoc ? 'rgba(45,140,111,.12)' : 'rgba(148,163,184,.12)',
                      border: `2px solid ${assoc ? 'rgba(45,140,111,.25)' : 'rgba(148,163,184,.25)'}`,
                      color: assoc ? 'var(--accent)' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900
                    }}>{initials}</div>

                    {/* Nome e contagem */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800 truncate">{label}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{items.length} recebimento(s)</div>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600">{fmtR(total)}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-widest">acumulado</div>
                    </div>
                  </div>

                  {/* ─ Linhas de detalhe (expandidas) ─ */}
                  {isOpen && (
                    <div className="border-t border-dashed border-gray-100">
                      {items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((i: any) => {
                        const conta = contas.find(c => c.id === i.conta_id)
                        const taxaMatch = i.descricao?.match(/\(Taxa: R\$\s*([^)]+)\)/)
                        const taxaStr = taxaMatch ? `R$ ${taxaMatch[1]}` : null
                        return (
                          <div key={i.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 transition-all border-b border-gray-50 last:border-0" style={{ paddingLeft: 60 }}>
                            {/* Data */}
                            <div className="w-20 shrink-0">
                              <span className="text-[11px] font-semibold text-gray-500">{fmtData(i.data)}</span>
                            </div>
                            {/* Descrição */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-semibold text-gray-700 truncate">{i.descricao}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{i.categoria}</span>
                                {conta && <span className="text-[9px] text-gray-400">&bull; {conta.nome}</span>}
                                {taxaStr && <span className="text-[9px] font-bold text-amber-600">Taxa: {taxaStr}</span>}
                              </div>
                            </div>
                            {/* Forma */}
                            <div className="shrink-0">
                              {i.forma_pagamento && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  {i.forma_pagamento}
                                </span>
                              )}
                            </div>
                            {/* Valor */}
                            <div className="w-24 text-right shrink-0">
                              <span className="text-[13px] font-black text-emerald-600">{fmtR(i.valor)}</span>
                            </div>
                            {/* Ações */}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Duplicar"><Copy size={13} /></button>
                              <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                              </button>
                              <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Receita' : 'Nova Receita'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        onChange={handleFieldChange}
        fields={[
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'conta_id', label: 'Conta de Destino', type: 'select', required: true, options: [
            ...contas.map(c => ({ value: c.id, label: c.nome })),
            { value: '', label: 'Selecione uma conta' }
          ]},
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Mensalidades', label: 'Mensalidades' },
            { value: 'ADESÃO', label: 'Adesão' },
            { value: 'Patrocínios', label: 'Patrocínios' },
            { value: 'Eventos', label: 'Eventos' },
            { value: 'Serviços', label: 'Serviços' },
            { value: 'Outros', label: 'Outros' },
          ]},
          { name: 'associado_id', label: 'Associado Vinculado', type: 'select', options: [
            { value: '', label: 'Nenhum' },
            ...associados.map(a => ({ value: a.id, label: a.nome }))
          ]},
          { name: 'recorrencia_ativa', label: 'Lançamento Recorrente', type: 'checkbox', placeholder: 'Esta receita se repete mensalmente?' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Recebido' },
            { value: 'pendente', label: 'Pendente' },
          ]},
          { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: [
            { value: 'Dinheiro', label: 'Dinheiro' },
            { value: 'PIX', label: 'PIX' },
            { value: 'Boleto', label: 'Boleto' },
            { value: 'Transferência', label: 'Transferência' },
            { value: 'Cartão', label: 'Cartão' },
          ]},
        ]}
      />
    </div>
  )
}
