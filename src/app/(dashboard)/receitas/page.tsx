'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { 
  Plus, Search, TrendingUp, Filter, Download, 
  Pencil, XCircle, RefreshCw, Layers
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { fmtR, fmtData, MESES, getMesIdx, getAnoIdx } from '@/lib/utils/formatters'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import PaymentBadge from '@/components/ui/PaymentBadge'
import CrudModal from '@/components/ui/CrudModal'
import LaunchDetailsModal from '@/components/ui/LaunchDetailsModal'
import BatchActionBar from '@/components/ui/BatchActionBar'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
]

const axisDefaults = {
  y: { 
    beginAtZero: true, 
    grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
    ticks: { font: { size: 10 }, color: '#94a3b8' }
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function ReceitasPage() {
  const { 
    lancamentos, loading, inserir, atualizar, remover, 
    inserirBulk, removerSerie, atualizarSerie, atualizarBulk, removerBulk
  } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [batchSearch, setBatchSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterConta, setFilterConta] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  // IMPORTANTE: filterMonth agora é 1-based (Jan=1, Fev=2...)
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterTax, setFilterTax] = useState('todos')
  const [filterValueMin, setFilterValueMin] = useState('')
  const [filterValueMax, setFilterValueMax] = useState('')
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  const filteredReceitas = useMemo(() => {
    const rawRecs = lancamentos.filter(l => (l.tipo || '').toLowerCase() === 'receita')
    const stats = { month: 0, year: 0, status: 0, conta: 0, cat: 0, search: 0 }

    const filtered = rawRecs.filter(r => {
      const mesIdx = getMesIdx(r.data) // Agora retorna 1-12
      const anoIdx = getAnoIdx(r.data)
      
      const matchMonth = Number(filterMonth) === -1 || Number(mesIdx) === Number(filterMonth)
      if (!matchMonth) stats.month++

      const matchYear = Number(anoIdx) === Number(filterYear)
      if (!matchYear) stats.year++

      const searchLower = searchTerm.toLowerCase().trim()
      const assoc = associados.find(a => a.id === r.associado_id)
      const cta = contas.find(c => c.id === r.conta_id)
      const matchSearch = !searchLower || (r.descricao || '').toLowerCase().includes(searchLower) || (assoc?.nome || '').toLowerCase().includes(searchLower) || (cta?.nome || '').toLowerCase().includes(searchLower) || (r.categoria || '').toLowerCase().includes(searchLower)
      if (!matchSearch) stats.search++

      const matchStatus = String(filterStatus).toLowerCase() === 'todos' || String(r.status).toLowerCase() === String(filterStatus).toLowerCase()
      if (!matchStatus) stats.status++

      const matchPagamento = String(filterPagamento).toLowerCase() === 'todos' || String(r.forma_pagamento).toLowerCase() === String(filterPagamento).toLowerCase()
      const matchConta = String(filterConta).toLowerCase() === 'todos' || String(r.conta_id).toLowerCase() === String(filterConta).toLowerCase()
      if (!matchConta) stats.conta++

      const matchCategoria = String(filterCategoria).toLowerCase() === 'todos' || String(r.categoria).toLowerCase() === String(filterCategoria).toLowerCase()
      if (!matchCategoria) stats.cat++

      const matchUnlinked = !onlyUnlinked || (!r.associado_id && !r.diretor_id)
      const hasTax = (r.descricao || '').includes('(Taxa:')
      const matchTax = filterTax === 'todos' || (filterTax === 'com_taxa' ? hasTax : !hasTax)
      const val = Number(r.valor)
      const matchMin = !filterValueMin || val >= Number(filterValueMin)
      const matchMax = !filterValueMax || val <= Number(filterValueMax)

      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchConta && matchCategoria && matchUnlinked && matchTax && matchMin && matchMax
    }).map(r => {
      const match = (r.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      return { ...r, taxaCalculada: match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0 }
    })

    return { data: filtered, stats }
  }, [lancamentos, searchTerm, filterStatus, filterPagamento, filterConta, filterCategoria, filterMonth, filterYear, filterTax, filterValueMin, filterValueMax, onlyUnlinked, associados, contas])

  const filteredData = filteredReceitas.data

  /* ── Gráficos ── */
  const receitaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    filteredData.forEach(r => {
      const mes = getMesIdx(r.data)
      if (mes >= 1 && mes <= 12) arr[mes - 1] += (r.valor || 0)
    })
    return arr
  }, [filteredData])

  const receitaCats = useMemo(() => {
    const m: Record<string, number> = {}
    filteredData.forEach(r => { const c = r.categoria || 'Outros'; m[c] = (m[c] || 0) + (r.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [filteredData])

  const totalReceitas = filteredData.reduce((s, r) => s + (r.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    const cleanData = { ...data, valor: Number(data.valor) }
    if (editingItem) {
      // Logic for editing
      await atualizar(editingItem.id, cleanData)
    } else {
      // Logic for inserting
      await inserirBulk([cleanData])
    }
    setEditingItem(null); setIsModalOpen(false)
  }

  const handleDetail = (item: any) => { setSelectedForDetail(item); setIsDetailModalOpen(true) }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (item: any) => { if (confirm('Excluir esta receita?')) await remover(item.id) }
  
  const handleBatchDelete = async () => {
    if (confirm(`Excluir ${selectedIds.length} receitas selecionadas?`)) {
      await removerBulk(selectedIds)
      setSelectedIds([])
    }
  }

  const handleBatchStatus = async (status: string) => {
    await atualizarBulk(selectedIds, { status: status as any })
    setSelectedIds([])
  }

  const modalFields = useMemo(() => [
    { name: 'data', label: 'Data', type: 'date' as const, required: true },
    { name: 'descricao', label: 'Descrição', type: 'text' as const, required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number' as const, required: true },
    { name: 'categoria', label: 'Categoria', type: 'select' as const, required: true, options: [
      { value: 'MENSALIDADE', label: 'Mensalidade' },
      { value: 'ADESAO', label: 'Adesão' },
      { value: 'PROJETOS', label: 'Projetos' },
      { value: 'OUTROS', label: 'Outros' }
    ]},
    { name: 'conta_id', label: 'Conta Bancária', type: 'select' as const, required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'associado_id', label: 'Associado (Opcional)', type: 'select' as const, options: associados.map(a => ({ value: a.id, label: a.nome })) }
  ], [contas, associados])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* DEBUG PANEL */}
      <div className="bg-slate-900 text-slate-400 p-2 text-[8px] rounded-lg font-mono flex flex-col gap-1">
        <div className="flex gap-4">
          <span>T_ID: {String(lancamentos[0]?.tenant_id || 'NULL').slice(0,8)}</span>
          <span>LEN: {lancamentos.length}</span>
          <span>FILT: {filteredData.length}</span>
          <span>Y/M: {filterYear}/{filterMonth}</span>
          <span>JAN_FOUND: {lancamentos.filter(l => String(l.data).includes('2026-01')).length}</span>
          <span className="text-rose-400">FAILED: M:{filteredReceitas.stats.month} Y:{filteredReceitas.stats.year}</span>
        </div>
        {lancamentos.length > 0 && (() => {
          const rec = lancamentos.find(l => (l.tipo || '').toLowerCase().includes('receita')) || lancamentos[0]
          return <div className="text-[7px] text-blue-300">EX: {getAnoIdx(rec.data)}/{getMesIdx(rec.data)} | {JSON.stringify(rec.data)}</div>
        })()}
      </div>

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)' }}><TrendingUp size={24} /></div>
          <div><div className="page-title">Receitas</div><div className="page-subtitle">Entradas financeiras — ACPROBEC</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-2 text-center shadow-sm">
            <div className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Total</div>
            <div className="text-xl font-black text-emerald-600">{fmtR(totalReceitas)}</div>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"><Plus size={20} /> Nova Receita</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[320px]">
          <Bar data={{ labels: MESES, datasets: [{ label: 'Receita', data: receitaMensal, backgroundColor: 'rgba(16,185,129,.8)', borderRadius: 8 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisDefaults }} />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[320px]">
          <Doughnut data={{ labels: Object.keys(receitaCats), datasets: [{ data: Object.values(receitaCats), backgroundColor: CHART_COLORS }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } } }} />
        </div>
      </div>

      {/* FILTROS INTEGRADOS */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-100" placeholder="Pesquisar descrição, categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-gray-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs">{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-gray-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs"><option value={-1}>Todos Meses</option>{MESES.map((m, i) => <option key={m} value={i+1}>{m}</option>)}</select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs">
          <option value="todos">Status: Todos</option>
          <option value="pago">Recebidos</option>
          <option value="pendente">Pendentes</option>
        </select>
        <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs">
          <option value="todos">Todas Categorias</option>
          <option value="MENSALIDADE">Mensalidade</option>
          <option value="ADESAO">Adesão</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable 
          data={filteredData} 
          loading={loading}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onRowClick={handleDetail}
          showFilterInputs={true}
          columns={[
            { header: 'Data', key: 'data', render: (l: any) => <span className="text-xs font-medium text-gray-600">{fmtData(l.data)}</span> },
            { header: 'Descrição', key: 'descricao', render: (l: any) => <div className="flex flex-col"><span className="text-sm font-bold">{l.descricao}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{l.categoria}</span></div> },
            { header: 'Valor', key: 'valor', render: (l: any) => <span className="text-sm font-black text-emerald-600">+{fmtR(l.valor)}</span> },
            { header: 'Status', key: 'status', render: (l: any) => <StatusBadge status={l.status as any} type="lancamento" /> },
            { header: 'Pagamento', key: 'forma_pagamento', render: (l: any) => <PaymentBadge method={l.forma_pagamento} /> },
            { header: '', key: 'id', render: (l: any) => (
              <div className="flex justify-end gap-2">
                <button onClick={() => handleEdit(l)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Pencil size={14}/></button>
                <button onClick={() => handleDelete(l)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><XCircle size={14}/></button>
              </div>
            )}
          ]} 
        />
      </div>

      <BatchActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={handleBatchDelete} onStatusChange={handleBatchStatus} />
      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Receita" initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
      <LaunchDetailsModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} launch={selectedForDetail} />
    </div>
  )
}
