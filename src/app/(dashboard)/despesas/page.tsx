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
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingDown, Plus, RefreshCw, Copy, Search, Filter, XCircle, AlertCircle, TrendingUp, Check } from 'lucide-react'

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
  const { lancamentos, loading, inserir, atualizar, remover, inserirBulk } = useFinanceiro()
  const { contas } = useContas()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  
  const despesas = useMemo(() => lancamentos.filter(l => l.tipo === 'despesa'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [batchSearch, setBatchSearch] = useState('')

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
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
      const matchUnlinked = !onlyUnlinked || (!d.fornecedor_id && !d.diretor_id)
      return matchMonth && matchYear && matchSearch && matchStatus && matchUnlinked
    })
  }, [despesas, searchTerm, filterStatus, filterMonth, filterYear, onlyUnlinked, fornecedores, contas])

  /* ── Gráficos ── */
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
    const cleanData = { ...data, tipo: 'despesa' }
    if (editingItem) { 
      await atualizar(editingItem.id, cleanData) 
    } else {
      const { is_lote, selected_fornecedores, recorrencia_ativa, recorrencia_meses, ...dbData } = data;
      
      if (is_lote && selected_fornecedores?.length > 0) {
        const batch: any[] = []
        selected_fornecedores.forEach((fornId: string) => {
          const forn = fornecedores.find(f => f.id === fornId)
          batch.push({ 
            ...dbData, 
            tipo: 'despesa',
            descricao: `${dbData.descricao.toUpperCase()} - ${forn?.nome.toUpperCase() || 'LOTE'}`,
            fornecedor_id: fornId, 
            status: dbData.status || 'aberto' 
          })
        })
        await inserirBulk(batch)
      } else if (recorrencia_ativa) {
        const meses = Number(recorrencia_meses || 12)
        const batch: any[] = []
        const forn = dbData.fornecedor_id ? fornecedores.find(f => f.id === dbData.fornecedor_id) : null;
        const baseDesc = forn ? `${dbData.descricao.toUpperCase()} - ${forn.nome.toUpperCase()}` : dbData.descricao.toUpperCase();

        for (let i = 0; i <= meses; i++) {
          const parts = dbData.data.includes('-') ? dbData.data.split('-').map(Number) : dbData.data.split('/').reverse().map(Number);
          const d = new Date(parts[0], parts[1] - 1 + i, Math.min(parts[2], new Date(parts[0], parts[1] + i, 0).getDate()));
          const dataStr = d.toISOString().split('T')[0];
          batch.push({ ...dbData, tipo: 'despesa', descricao: baseDesc, data: dataStr, status: i === 0 ? (dbData.status || 'aberto') : 'aberto' });
        }
        await inserirBulk(batch)
      } else {
        const forn = dbData.fornecedor_id ? fornecedores.find(f => f.id === dbData.fornecedor_id) : null;
        const finalDesc = forn ? `${dbData.descricao.toUpperCase()} - ${forn.nome.toUpperCase()}` : dbData.descricao.toUpperCase();
        await inserir({ ...dbData, tipo: 'despesa', descricao: finalDesc, status: dbData.status || 'aberto' })
      }
    }
    setEditingItem(null); setIsModalOpen(false)
  }

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => { setEditingItem({ ...item, id: undefined }); setIsModalOpen(true) }
  const handleDelete = async (id: string) => { if (confirm('Excluir esta despesa?')) await remover(id) }

  const modalFields: Field[] = useMemo(() => [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'conta_id', label: 'Conta de Origem', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [{ value: 'Folha', label: 'Folha de Pagamento' }, { value: 'Impostos', label: 'Impostos e Taxas' }, { value: 'Infraestrutura', label: 'Infraestrutura' }, { value: 'Marketing', label: 'Marketing' }, { value: 'Suprimentos', label: 'Suprimentos / Outros' }] },
    { name: 'fornecedor_id', label: 'Fornecedor Individual', type: 'select', showIf: (f: any) => !f.is_lote, options: [{ value: '', label: 'Nenhum' }, ...fornecedores.map(f => ({ value: f.id, label: f.nome }))] },
    { name: 'is_lote', label: '🚀 Lançar em Lote?', type: 'checkbox', showIf: (f: any) => !editingItem },
    { 
      name: 'batch_selection', label: 'Selecionar Fornecedores (Lote)', type: 'info', showIf: (f: any) => f.is_lote,
      render: (formData: any, handleChange: any) => {
        const selected = formData.selected_fornecedores || []
        const filteredList = fornecedores.filter(f => f.nome.toLowerCase().includes(batchSearch.toLowerCase())).slice(0, 10)
        return (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input type="text" placeholder="Pesquisar fornecedor..." className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-gray-100 outline-none focus:ring-2 ring-red-50" value={batchSearch} onChange={e => setBatchSearch(e.target.value)} /></div>
            <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto pr-2">
              {filteredList.map(f => {
                const isSel = selected.includes(f.id)
                return (
                  <button key={f.id} type="button" onClick={() => handleChange('selected_fornecedores', isSel ? selected.filter((sid: string) => sid !== f.id) : [...selected, f.id])} className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${isSel ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'}`}>
                    <span className="text-xs font-bold truncate">{f.nome}</span>
                    {isSel ? <Check size={14} /> : <Plus size={14} className="text-gray-300" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }
    },
    { name: 'recorrencia_ativa', label: 'Lançamento Recorrente', type: 'checkbox' },
    { name: 'recorrencia_meses', label: 'Meses', type: 'number', showIf: (f: any) => f.recorrencia_ativa, defaultValue: 12 },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Pago' }, { value: 'aberto', label: 'Pendente' }, { value: 'atrasado', label: 'Atrasado' }] }
  ], [contas, fornecedores, batchSearch, editingItem])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}><TrendingDown size={24} /></div>
          <div><div className="page-title">Despesas</div><div className="page-subtitle">Saídas financeiras — ACPROBEC</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>-{fmtR(totalDespesas)}</div></div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn" style={{ background: 'var(--red)', color: '#fff', padding: '10px 20px', fontSize: 13, borderRadius: 'var(--radius-sm)', boxShadow: '0 2px 8px rgba(239,68,68,.35)' }}><Plus size={16} /> Nova Despesa</button>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Despesas por Mês" subtitle="Evolução mensal das saídas"><Bar data={{ labels: MESES, datasets: [{ label: 'Despesa', data: despesaMensal, backgroundColor: 'rgba(224,123,57,.72)', borderRadius: 5, borderSkipped: false }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisDefaults }} /></ChartCard>
        <ChartCard title="🍩 Mix por Categoria" subtitle="Distribuição das despesas"><Doughnut data={{ labels: Object.keys(despesaCats), datasets: [{ data: Object.values(despesaCats), backgroundColor: CHART_COLORS, hoverOffset: 6, borderWidth: 2, borderColor: '#fff' }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } } }} /></ChartCard>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[280px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-red-300 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-gray-50 px-3 py-2 rounded-xl text-xs font-bold border-none outline-none">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="bg-gray-50 px-3 py-2 rounded-xl text-xs font-bold border-none outline-none"><option value={-1}>Mês: Todos</option>{MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}</select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"><DataTable columns={[
        { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
        { header: 'Descrição', key: 'descricao', render: (i: any) => <div style={{ display: 'flex', flexDirection: 'column' }}><div className="flex items-center gap-2"><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>{i.banco_transacao_id && <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 shadow-sm uppercase tracking-tighter"><RefreshCw size={8} /> OFX</span>}</div><span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span></div> },
        { header: 'Valor', key: 'valor', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--red)' }}>-{fmtR(i.valor)}</span> },
        { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
        { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
        { header: '', key: 'acoes', className: 'w-20 text-right', render: (i: any) => <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Plus size={14} className="rotate-45" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><XCircle size={14} /></button></div> }
      ]} data={filteredDespesas} loading={loading} /></div>

      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Despesa' : 'Nova Despesa'} initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
    </div>
  )
}
