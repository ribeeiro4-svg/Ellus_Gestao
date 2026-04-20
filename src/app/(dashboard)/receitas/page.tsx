'use client'
import React, { useState, useMemo } from 'react'
import { Plus, Search, TrendingUp, Pencil, XCircle, RefreshCw, Target, ArrowUpCircle, Activity, DollarSign } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { fmtR, fmtData, MESES, getMesIdx, getAnoIdx, safeSum, safeDiff } from '@/lib/utils/formatters'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import PaymentBadge from '@/components/ui/PaymentBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import LaunchDetailsModal from '@/components/ui/LaunchDetailsModal'
import IndicarCompetenciaModal from '@/components/ui/IndicarCompetenciaModal'
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
  const { lancamentos, loading: loadFin, inserir, atualizar, remover, removerBulk, inserirBulk, atualizarBulk, conciliar, remanejar, refresh: refetch } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const { categorias } = useCategorias()
  
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    refetch(filterYear)
  }, [filterYear, refetch])
  
  const { orcamentos, loading: loadOrc } = useOrcamentos(filterMonth, filterYear)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCompModalOpen, setIsCompModalOpen] = useState(false)
  const [compItem, setCompItem] = useState<any>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterConta, setFilterConta] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterTax, setFilterTax] = useState('todos')
  const [filterValueMin, setFilterValueMin] = useState('')
  const [filterValueMax, setFilterValueMax] = useState('')
  const [filterVinculo, setFilterVinculo] = useState('todos')

  const filteredReceitas = useMemo(() => {
    const rawRecs = lancamentos.filter(l => (l.tipo || '').toLowerCase() === 'receita')
    const stats = { month: 0, year: 0, status: 0, conta: 0, cat: 0, search: 0 }

    const filtered = rawRecs.filter(r => {
      const m = getMesIdx(r.data)
      const a = getAnoIdx(r.data)
      const matchMonth = Number(filterMonth) === -1 || Number(m) === Number(filterMonth)
      const matchYear = Number(a) === Number(filterYear)
      
      const searchLower = searchTerm.toLowerCase().trim()
      const assoc = associados.find(as => as.id === r.associado_id)
      const cta = contas.find(c => c.id === r.conta_id)
      const matchSearch = !searchLower || (r.descricao || '').toLowerCase().includes(searchLower) || (assoc?.nome || '').toLowerCase().includes(searchLower) || (cta?.nome || '').toLowerCase().includes(searchLower) || (r.categoria || '').toLowerCase().includes(searchLower)
      
      const matchStatus = String(filterStatus).toLowerCase() === 'todos' || String(r.status).toLowerCase() === String(filterStatus).toLowerCase()
      const matchPagamento = String(filterPagamento).toLowerCase() === 'todos' || String(r.forma_pagamento).toLowerCase() === String(filterPagamento).toLowerCase()
      const matchConta = String(filterConta).toLowerCase() === 'todos' || 
                        (filterConta === 'dinheiro' ? r.forma_pagamento === 'Dinheiro' : String(r.conta_id).toLowerCase() === String(filterConta).toLowerCase())
      const matchCategoria = String(filterCategoria).toLowerCase() === 'todos' || String(r.categoria).toLowerCase() === String(filterCategoria).toLowerCase()
      const matchVinculo = filterVinculo === 'todos' || (filterVinculo === 'com' ? (r.associado_id || r.diretor_id) : (!r.associado_id && !r.diretor_id))
      const hasTax = (r.descricao || '').includes('(Taxa:')
      const matchTax = filterTax === 'todos' || (filterTax === 'com_taxa' ? hasTax : !hasTax)
      const val = Number(r.valor)
      const matchMin = !filterValueMin || val >= Number(filterValueMin)
      const matchMax = !filterValueMax || val <= Number(filterValueMax)

      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchConta && matchCategoria && matchVinculo && matchTax && matchMin && matchMax
    }).map(r => {
      const match = (r.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      return { ...r, taxaCalculada: match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0 }
    })

    return { data: filtered, stats }
  }, [lancamentos, searchTerm, filterStatus, filterPagamento, filterConta, filterCategoria, filterMonth, filterYear, filterTax, filterValueMin, filterValueMax, filterVinculo, associados, contas])

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
    let sumVal = 0, sumTax = 0, sumCora = 0, sumCash = 0, sumDesp = 0
    let prevVal = 0, prevTax = 0, prevCora = 0, prevCash = 0, prevDesp = 0

    const prevMonth = filterMonth === 0 ? 11 : filterMonth - 1
    const prevYear = filterMonth === 0 ? filterYear - 1 : filterYear

    lancamentos.forEach(r => {
      const m = getMesIdx(r.data), a = getAnoIdx(r.data)
      const matchTaxStr = (r.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      const t = matchTaxStr ? parseFloat(matchTaxStr[1].replace(/\./g, '').replace(',', '.')) : 0
      const v = r.valor || 0
      const bruto = Math.round((v + t) * 100) / 100
      const isRec = (r.tipo || '').toLowerCase() === 'receita'

      if (a === filterYear && (filterMonth === -1 || m === filterMonth)) {
        if (isRec) {
          sumVal = safeSum(sumVal, v)
          sumTax = safeSum(sumTax, t)
          if (r.forma_pagamento === 'Dinheiro') sumCash = safeSum(sumCash, v)
          else sumCora = safeSum(sumCora, bruto)
        } else {
          sumDesp = safeSum(sumDesp, v)
        }
      }

      if (a === prevYear && m === prevMonth) {
        if (isRec) {
          prevVal = safeSum(prevVal, v)
          prevTax = safeSum(prevTax, t)
          if (r.forma_pagamento === 'Dinheiro') prevCash = safeSum(prevCash, v)
          else prevCora = safeSum(prevCora, bruto)
        } else {
          prevDesp = safeSum(prevDesp, v)
        }
      }
    })

    const calcVs = (curr: number, prev: number) => {
      if (prev <= 0) return 100
      return Math.round(((curr - prev) / prev) * 100)
    }

    return { 
      totalRec: sumVal + sumTax, 
      totalCora: sumCora, 
      totalDinheiro: sumCash, 
      superavit: safeDiff(sumVal + sumTax, sumDesp),
      vsCora: calcVs(sumCora, prevCora),
      vsDinheiro: calcVs(sumCash, prevCash),
      vsRec: calcVs(sumVal + sumTax, prevVal + prevTax),
      vsSuperavit: calcVs(safeDiff(sumVal + sumTax, sumDesp), safeDiff(prevVal + prevTax, prevDesp))
    }
  }, [lancamentos, filterMonth, filterYear])

  const { totalRec, totalCora, totalDinheiro, superavit, vsCora, vsDinheiro, vsRec, vsSuperavit } = periodSummary

  const handleSalvar = async (data: any) => {
    const safeData = { 
      ...data, 
      valor: Number(data.valor), 
      tipo: 'receita',
      associado_id: data.associado_id || null,
      conta_id: data.conta_id || null
    }
    setLoading(true)
    try {
      let res
      if (editingItem) {
        const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null
        const finalDesc = assoc ? `${safeData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : safeData.descricao.toUpperCase()
        res = await atualizar(editingItem.id, { ...safeData, descricao: finalDesc })
      } else {
        const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...dbData } = safeData;
        
        if (is_lote && selected_associados?.length > 0) {
          const batch: any[] = []
          selected_associados.forEach((assocId: string) => {
            const assoc = associados.find(a => a.id === assocId)
            batch.push({ 
              ...dbData, 
              descricao: `${dbData.descricao.toUpperCase()} - ${assoc?.nome.toUpperCase() || 'LOTE'}`,
              associado_id: assocId, 
              status: safeData.status || 'aberto' 
            })
          })
          res = await inserirBulk(batch)
        } else if (recorrencia_ativa) {
          const mesesAFrente = Number(recorrencia_meses || 12)
          const batch: any[] = []
          const assoc = dbData.associado_id ? associados.find(a => a.id === dbData.associado_id) : null;
          const finalDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase();

          for (let i = 0; i <= mesesAFrente; i++) {
            const parts = dbData.data.includes('-') 
              ? dbData.data.split('-').map(Number)
              : dbData.data.split('/').reverse().map(Number);
            const targetMonth = parts[1] - 1 + i;
            const targetYear = parts[0];
            const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
            const finalDay = Math.min(parts[2], lastDay);
            const d = new Date(targetYear, targetMonth, finalDay);
            const dataString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            batch.push({ ...dbData, descricao: finalDesc, data: dataString, status: i === 0 ? (dbData.status || 'aberto') : 'aberto' });
          }
          res = await inserirBulk(batch);
        } else {
          const assoc = dbData.associado_id ? associados.find(a => a.id === dbData.associado_id) : null;
          const finalDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase();
          
          const itemsToInsert = [];
          
          // Prepara a receita principal
          itemsToInsert.push({ 
            ...dbData, 
            descricao: finalDesc, 
            status: dbData.status || 'aberto' 
          });

          // Se houver troco em PIX, prepara a despesa automática
          if (data.troco_via_pix && Number(data.valor_troco) > 0) {
              itemsToInsert.push({
                  tipo: 'despesa' as const,
                  descricao: `TROCO EM PIX - ${assoc?.nome.toUpperCase() || 'CLIENTE'}`,
                  valor: Number(data.valor_troco),
                  data: dbData.data,
                  status: 'pago' as const,
                  conta_id: dbData.conta_id,
                  categoria: 'TROCO',
                  forma_pagamento: 'PIX'
              });
          }
          
          res = await inserirBulk(itemsToInsert);
        }
      }

      if (res?.error) alert(`Erro ao salvar: ${res.error}`)
      else { setEditingItem(null); setIsModalOpen(false) }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDetail = (item: any) => { setSelectedForDetail(item); setIsDetailModalOpen(true) }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (item: any) => { if (confirm('Excluir?')) await remover(item.id) }
  const handleBatchDelete = async () => { if (confirm(`Excluir ${selectedIds.length}?`)) { await removerBulk(selectedIds); setSelectedIds([]) } }
  const handleBatchStatus = async (status: string) => { await atualizarBulk(selectedIds, { status: status as any }); setSelectedIds([]) }

  const modalFields: Field[] = useMemo(() => [
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'aberto', label: 'Provisionado' }, { value: 'pago', label: 'Efetivado (Pago)' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: categorias.map(c => ({ value: c.nome, label: c.nome })) },
    { name: 'forma_pagamento', label: 'Forma', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => !f.is_lote, options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
    { name: 'is_lote', label: 'Lançar em Lote?', type: 'checkbox', showIf: (f: any) => !editingItem },
    { name: 'selected_associados', label: 'Selecionar Associados', type: 'info', showIf: (f: any) => f.is_lote, render: (formData, handleChange) => (
      <div className="grid grid-cols-2 gap-2 mt-2 max-h-[150px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
        {associados.filter(a => a.status === 'ativo').map(a => (
          <label key={a.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer transition-colors text-[10px] font-bold">
            <input type="checkbox" checked={(formData.selected_associados || []).includes(a.id)} onChange={e => {
              const prev = formData.selected_associados || []
              const next = e.target.checked ? [...prev, a.id] : prev.filter((id: string) => id !== a.id)
              handleChange('selected_associados', next)
            }} className="rounded" />
            <span className="truncate">{a.nome}</span>
          </label>
        ))}
      </div>
    )},
    { name: 'troco_via_pix', label: 'Houve Troco em PIX?', type: 'checkbox' },
    { name: 'valor_troco', label: 'Valor do Troco', type: 'number', showIf: (f: any) => f.troco_via_pix },
    { name: 'recorrencia_ativa', label: 'Ativar Recorrência?', type: 'checkbox' },
    { name: 'recorrencia_meses', label: 'Meses à frente', type: 'select', showIf: (f: any) => f.recorrencia_ativa, options: [{ value: '1', label: '1 mês' }, { value: '3', label: '3 meses' }, { value: '6', label: '6 meses' }, { value: '12', label: '12 meses' }] },
  ], [contas, associados, categorias, editingItem])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-6 bg-white/40 backdrop-blur-sm p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200"><TrendingUp size={28} /></div>
          <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Receitas</h1><p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">Fluxo de Entradas</p></div>
        </div>
        <div className="flex items-center gap-4 relative z-[60]">
          <KpiCard title="Conta Bancária" value={fmtR(totalCora)} icon={<ArrowUpCircle size={20} />} category="indigo" trend={vsCora} trendLabel="vs mês anterior" />
          <KpiCard title="Caixa (Espécie)" value={fmtR(totalDinheiro)} icon={<DollarSign size={20} className="text-emerald-500" />} category="success" trend={vsDinheiro} trendLabel="vs mês anterior" />
          <KpiCard title="Receita Realizada" value={fmtR(totalRec)} icon={<TrendingUp size={20} />} category="success" trend={vsRec} trendLabel="vs mês anterior" />
          <KpiCard title="Superávit" value={fmtR(superavit)} icon={<Activity size={20} />} category={superavit >= 0 ? "success" : "error"} trend={vsSuperavit} trendLabel="vs mês anterior" />
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95 group"><Plus size={24} className="group-hover:rotate-90 transition-transform" /> NOVA RECEITA</button>
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
        <select value={filterConta} onChange={e => setFilterConta(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs"><option value="todos">Todas Contas</option>{contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}<option value="dinheiro">Dinheiro</option></select>
        <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border-none outline-none font-bold text-xs"><option value="todos">Categorias</option>{categorias.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}</select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable data={filteredData} loading={loadFin} selectedIds={selectedIds} onSelectChange={setSelectedIds} onRowClick={handleDetail} showFilterInputs={true} columns={[
          { header: 'Recebimento', key: 'data', render: (l: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(l.data)}</span> },
          { header: 'Competência', key: 'competencia_mes', render: (l: any) => {
            if (l.competencia_mes === undefined || l.competencia_mes === null) {
              const d = new Date(l.data)
              return <span className="text-[10px] font-bold text-slate-400 opacity-60 italic">{MESES[d.getMonth()]}/{d.getFullYear()}</span>
            }
            return <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight bg-emerald-50 px-2 py-1 rounded-md">{MESES[l.competencia_mes]}/{l.competencia_ano}</span>
          }},
          { header: 'Descrição', key: 'descricao', render: (l: any) => (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">{l.descricao.replace(/\(Taxa: [^)]+\)/, '').trim()}</span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{l.categoria}</span>
            </div>
          ) },
          { header: 'Valor', key: 'valor', render: (l: any) => <span className="text-sm font-black text-emerald-600">+{fmtR(l.valor)}</span> },
          { header: 'Status', key: 'status', render: (l: any) => <StatusBadge status={l.status as any} type="lancamento" /> },
          { header: 'Pagamento', key: 'forma_pagamento', render: (l: any) => <PaymentBadge method={l.forma_pagamento} /> },
          { header: '', key: 'id', render: (l: any) => (
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setCompItem(l); setIsCompModalOpen(true) }} 
                className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                title="Indicar Competência"
              >
                <Target size={14}/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(l) }} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Pencil size={14}/></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(l) }} className="p-2 text-red-600 bg-red-50 rounded-lg"><XCircle size={14}/></button>
            </div>
          ) }
        ]} />
      </div>

      <BatchActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={handleBatchDelete} onStatusChange={handleBatchStatus} />
      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Receita' : 'Nova Receita'} initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} loading={loading} />
      <LaunchDetailsModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} launch={selectedForDetail} associados={associados} onRemanejar={remanejar} />
      <IndicarCompetenciaModal 
        isOpen={isCompModalOpen} 
        onClose={() => setIsCompModalOpen(false)} 
        launch={compItem} 
        lancamentos={lancamentos}
        onSave={async (id, mes, ano) => {
          await atualizar(id, { competencia_mes: mes, competencia_ano: ano })
        }} 
      />
    </div>
  )
}
