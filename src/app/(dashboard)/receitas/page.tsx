'use client'

import React, { useState, useMemo } from 'react'
import { 
  Plus, Search, TrendingUp,
  Pencil, XCircle, RefreshCw, Target, ArrowUpCircle, Activity, DollarSign
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { fmtR, fmtData, MESES, getMesIdx, getAnoIdx } from '@/lib/utils/formatters'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import PaymentBadge from '@/components/ui/PaymentBadge'
import CrudModal from '@/components/ui/CrudModal'
import LaunchDetailsModal from '@/components/ui/LaunchDetailsModal'
import BatchActionBar from '@/components/ui/BatchActionBar'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
const axisDefaults = {
  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function ReceitasPage() {
  const { lancamentos, loading: loadFin, inserir, atualizar, remover, inserirBulk, atualizarBulk, removerBulk, conciliar, remanejar, refresh: refetch } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth()) // 0-based
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  // Sincroniza busca ao mudar de ano
  React.useEffect(() => {
    refetch(filterYear)
  }, [filterYear, refetch])
  
  const { orcamentos, loading: loadOrc } = useOrcamentos(filterMonth, filterYear)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterConta, setFilterConta] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterTax, setFilterTax] = useState('todos')
  const [filterValueMin, setFilterValueMin] = useState('')
  const [filterValueMax, setFilterValueMax] = useState('')
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  const filteredReceitas = useMemo(() => {
    const rawRecs = lancamentos.filter(l => (l.tipo || '').toLowerCase() === 'receita')
    const stats = { month: 0, year: 0, status: 0, conta: 0, cat: 0, search: 0 }

    const filtered = rawRecs.filter(r => {
      const m = getMesIdx(r.data)
      const a = getAnoIdx(r.data)
      
      const matchMonth = Number(filterMonth) === -1 || Number(m) === Number(filterMonth)
      if (!matchMonth) stats.month++

      const matchYear = Number(a) === Number(filterYear)
      if (!matchYear) stats.year++

      const searchLower = searchTerm.toLowerCase().trim()
      const assoc = associados.find(as => as.id === r.associado_id)
      const cta = contas.find(c => c.id === r.conta_id)
      const matchSearch = !searchLower || (r.descricao || '').toLowerCase().includes(searchLower) || (assoc?.nome || '').toLowerCase().includes(searchLower) || (cta?.nome || '').toLowerCase().includes(searchLower) || (r.categoria || '').toLowerCase().includes(searchLower)
      if (!matchSearch) stats.search++

      const matchStatus = String(filterStatus).toLowerCase() === 'todos' || String(r.status).toLowerCase() === String(filterStatus).toLowerCase()
      if (!matchStatus) stats.status++

      const matchPagamento = String(filterPagamento).toLowerCase() === 'todos' || String(r.forma_pagamento).toLowerCase() === String(filterPagamento).toLowerCase()
      const matchConta = String(filterConta).toLowerCase() === 'todos' || 
                        (filterConta === 'dinheiro' ? r.forma_pagamento === 'Dinheiro' : String(r.conta_id).toLowerCase() === String(filterConta).toLowerCase())
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

  const receitaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    filteredData.forEach(r => {
      const m = getMesIdx(r.data); if (m >= 0 && m < 12) arr[m] += (r.valor || 0)
    })
    return arr
  }, [filteredData])

  const receitaCats = useMemo(() => {
    const m: Record<string, number> = {}
    filteredData.forEach(r => { const c = r.categoria || 'Outros'; m[c] = (m[c] || 0) + (r.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [filteredData])

  const periodSummary = useMemo(() => {
    const rawRecs = lancamentos.filter(l => (l.tipo || '').toLowerCase() === 'receita')
    let sumVal = 0
    let sumTax = 0
    let sumCora = 0
    let sumCash = 0

    rawRecs.forEach(r => {
      const m = getMesIdx(r.data)
      const a = getAnoIdx(r.data)
      const matchMonth = Number(filterMonth) === -1 || Number(m) === Number(filterMonth)
      const matchYear = Number(a) === Number(filterYear)

      if (matchMonth && matchYear) {
        const matchTaxStr = (r.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
        const t = matchTaxStr ? parseFloat(matchTaxStr[1].replace(/\./g, '').replace(',', '.')) : 0
        const v = r.valor || 0
        const bruto = Math.round((v + t) * 100) / 100

        sumVal = Math.round((sumVal + v) * 100) / 100
        sumTax = Math.round((sumTax + t) * 100) / 100

        if (r.forma_pagamento === 'Dinheiro') {
          sumCash = Math.round((sumCash + v) * 100) / 100
        } else {
          sumCora = Math.round((sumCora + bruto) * 100) / 100
        }
      }
    })

    const planejado = orcamentos.filter(o => o.tipo === 'receita').reduce((s, o) => s + o.valor_planejado, 0)

    return { 
      totalReceitas: sumVal, 
      totalTaxas: sumTax, 
      totalCora: sumCora, 
      totalDinheiro: sumCash,
      receitaPlanejada: planejado
    }
  }, [lancamentos, filterMonth, filterYear, orcamentos])

  const { totalReceitas, totalTaxas, totalCora, totalDinheiro, receitaPlanejada } = periodSummary

  const handleSalvar = async (data: any) => {
    const cleanData = { ...data, valor: Number(data.valor) }
    if (editingItem) await atualizar(editingItem.id, cleanData)
    else await inserirBulk([cleanData])
    setEditingItem(null); setIsModalOpen(false)
  }

  const handleDetail = (item: any) => { setSelectedForDetail(item); setIsDetailModalOpen(true) }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (item: any) => { if (confirm('Excluir?')) await remover(item.id) }
  const handleBatchDelete = async () => { if (confirm(`Excluir ${selectedIds.length}?`)) { await removerBulk(selectedIds); setSelectedIds([]) } }
  const handleBatchStatus = async (status: string) => { await atualizarBulk(selectedIds, { status: status as any }); setSelectedIds([]) }

  const modalFields = useMemo(() => [
    { name: 'data', label: 'Data', type: 'date' as const, required: true },
    { name: 'descricao', label: 'Descrição', type: 'text' as const, required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number' as const, required: true },
    { name: 'categoria', label: 'Categoria', type: 'select' as const, required: true, options: [{ value: 'MENSALIDADE', label: 'Mensalidade' }, { value: 'ADESAO', label: 'Adesão' }, { value: 'PROJETOS', label: 'Projetos' }, { value: 'OUTROS', label: 'Outros' }] },
    { name: 'conta_id', label: 'Conta Bancária', type: 'select' as const, required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'associado_id', label: 'Associado', type: 'select' as const, options: associados.map(a => ({ value: a.id, label: a.nome })) }
  ], [contas, associados])

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between flex-wrap gap-6 bg-white/40 backdrop-blur-sm p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-pulse-slow">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Receitas</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">Fluxo de Entradas — ACPROBEC</p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-[60] overflow-visible">
          <KpiCard 
            title="Conta Bancária" 
            value={fmtR(totalCora)} 
            icon={<ArrowUpCircle size={20} />} 
            category="indigo" 
            explanation={{
              description: "Total de entradas conciliadas ou vinculadas a contas bancárias (Cora, etc).",
              formula: "Σ(Receitas Bancárias + Taxas)",
              example: "Um depósito de R$ 52,01 é contabilizado integralmente."
            }}
          />
          <KpiCard 
            title="Caixa (Espécie)" 
            value={fmtR(totalDinheiro)} 
            icon={<DollarSign size={20} className="text-emerald-500" />} 
            category="success" 
            explanation={{
              description: "Total de recebimentos realizados em dinheiro físico (mãos).",
              formula: "Σ(Receitas em Espécie)",
              example: "Recebimento de mensalidade de R$ 50,00 em dinheiro."
            }}
          />
          <KpiCard 
            title="Receita Realizada" 
            value={fmtR(totalReceitas + totalTaxas)} 
            icon={<TrendingUp size={20} />} 
            category="success" 
            explanation={{
              description: "Soma total de todas as receitas (Banco + Caixa), reintegrando taxas bancárias.",
              formula: "Σ(Banco + Caixa + Taxas)",
              example: "Total consolidado de todas as fontes de receita."
            }}
          />
          <KpiCard 
            title="Planejado" 
            value={fmtR(receitaPlanejada)} 
            icon={<Target size={20} />} 
            category="info" 
            explanation={{
              description: "Meta de faturamento definida para este mês conforme o planejamento orçamentário.",
              formula: "Σ(Metas de Receita configuradas)",
              example: "Valor alvo definido na aba de Planejamento Financeiro."
            }}
          />
          <KpiCard 
            title="Diferença" 
            value={fmtR(totalReceitas - receitaPlanejada)} 
            trend={Math.round((totalReceitas / (receitaPlanejada || 1) - 1) * 100)}
            trendLabel={totalReceitas >= receitaPlanejada ? "Superávit" : "Déficit"}
            icon={<Activity size={20} />} 
            category={totalReceitas >= receitaPlanejada ? "success" : "error"} 
            explanation={{
              description: "Comparativo entre o faturamento real e a meta.",
              formula: "Faturamento Realizado - Planejado",
              example: "Mostra se a associação está acima ou abaixo do esperado."
            }}
          />
          <KpiCard 
            title="Taxas" 
            value={fmtR(totalTaxas)} 
            icon={<RefreshCw size={20} />} 
            category="indigo" 
            explanation={{
              description: "Total de descontos bancários (tarifas) que foram 'devolvidos' ao faturamento para auditoria bruta.",
              formula: "Σ(Taxas detectadas nas descrições)",
              example: "Recuperação visual de tarifas de manutenção e emissão."
            }}
          />
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true) }} 
            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" /> 
            NOVA RECEITA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[320px]"><Bar data={{ labels: MESES, datasets: [{ label: 'Receita', data: receitaMensal, backgroundColor: 'rgba(16,185,129,.8)', borderRadius: 8 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisDefaults }} /></div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[320px]"><Doughnut data={{ labels: Object.keys(receitaCats), datasets: [{ data: Object.values(receitaCats), backgroundColor: CHART_COLORS }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } } }} /></div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[300px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-100 font-medium text-sm" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs">{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs"><option value={-1}>Todos Meses</option>{MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs"><option value="todos">Status: Todos</option><option value="pago">Recebidos</option><option value="pendente">Pendentes</option></select>
        <select value={filterConta} onChange={e => setFilterConta(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs">
          <option value="todos">Todas as Contas</option>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          <option value="dinheiro">Caixa (Espécie)</option>
        </select>
        <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs"><option value="todos">Categorias</option><option value="MENSALIDADE">Mensalidade</option><option value="ADESAO">Adesão</option></select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable data={filteredData} loading={loadFin} selectedIds={selectedIds} onSelectChange={setSelectedIds} onRowClick={handleDetail} showFilterInputs={true} columns={[
          { header: 'Data', key: 'data', render: (l: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(l.data)}</span> },
          { header: 'Descrição', key: 'descricao', render: (l: any) => (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  {l.descricao
                    .replace('[ENCONTRO DE CONTAS]', '')
                    .replace(/\(Taxa: [^)]+\)/, '')
                    .replace(/\(Origem: [^)]+\)/, '')
                    .trim()}
                </span>
                {l.descricao.includes('[ENCONTRO DE CONTAS]') && (
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-[9px] font-black text-indigo-600 rounded-md border border-indigo-200 uppercase tracking-tighter">ec</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{l.categoria}</span>
            </div>
          ) },
          { header: 'Valor', key: 'valor', render: (l: any) => <span className="text-sm font-black text-emerald-600">+{fmtR(l.valor)}</span> },
          { header: 'Status', key: 'status', render: (l: any) => <StatusBadge status={l.status as any} type="lancamento" /> },
          { header: 'Pagamento', key: 'forma_pagamento', render: (l: any) => <PaymentBadge method={l.forma_pagamento} /> },
          { header: '', key: 'id', render: (l: any) => (<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(l)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Pencil size={14}/></button><button onClick={() => handleDelete(l)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><XCircle size={14}/></button></div>) }
        ]} />
      </div>

      <BatchActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={handleBatchDelete} onStatusChange={handleBatchStatus} />
      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Receita" initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
      <LaunchDetailsModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        launch={selectedForDetail} 
        associados={associados}
        onRemanejar={remanejar}
        linkedName={associados.find(a => a.id === selectedForDetail?.associado_id)?.nome}
        linkedType="associado"
      />
    </div>
  )
}
