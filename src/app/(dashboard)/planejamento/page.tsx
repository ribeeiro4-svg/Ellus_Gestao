'use client'
import React, { useState, useMemo } from 'react'
import { 
  Calendar, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Save,
  RefreshCw
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { fmtR, MESES, fmtPct } from '@/lib/utils/formatters'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController)

export default function PlanejamentoPage() {
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth())
  const [selectedAno] = useState(new Date().getFullYear())
  
  const { lancamentos, loading: loadFin } = useFinanceiro()
  const { orcamentos, loading: loadOrc, inserir, atualizar, refresh } = useOrcamentos(selectedMes, selectedAno)
  
  // Controle de edições e estados de salvamento
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)

  // Extrair categorias reais dos lançamentos para sugerir orçamentos
  const todasCategorias = useMemo(() => {
    const cats = new Set<string>()
    lancamentos.forEach(l => cats.add(l.categoria))
    return Array.from(cats).sort()
  }, [lancamentos])

  const comparativo = useMemo(() => {
    return todasCategorias.map(cat => {
      const lancMes = lancamentos.filter(l => 
        l.categoria === cat && 
        new Date(l.data).getMonth() === selectedMes &&
        new Date(l.data).getFullYear() === selectedAno
      )
      
      const realizado = lancMes.reduce((sum, l) => sum + l.valor, 0)
      const orc = orcamentos.find(o => o.categoria === cat)
      const planejado = editValues[cat] !== undefined ? editValues[cat] : (orc?.valor_planejado || 0)
      const tipo = lancMes[0]?.tipo || (cat.toLowerCase().includes('receita') || cat.toLowerCase().includes('adesão') ? 'receita' : 'despesa')

      return {
        id: orc?.id || `new-${cat}`,
        categoria: cat,
        tipo,
        planejado,
        realizado,
        isDirty: editValues[cat] !== undefined && editValues[cat] !== (orc?.valor_planejado || 0),
        variacao: planejado > 0 ? ((realizado - planejado) / planejado) * 100 : 0,
        status: realizado <= planejado ? 'dentro' : 'acima'
      }
    })
  }, [todasCategorias, lancamentos, orcamentos, selectedMes, selectedAno, editValues])

  const handleSaveOrcamento = async (categoria: string, valor: number, id: string) => {
    setSavingIds(prev => new Set(prev).add(id))
    try {
      if (id.startsWith('new-')) {
        await inserir({
          mes: selectedMes,
          ano: selectedAno,
          categoria,
          tipo: comparativo.find(c => c.categoria === categoria)?.tipo || 'despesa',
          valor_planejado: valor
        })
      } else {
        await atualizar(id, { valor_planejado: valor })
      }
      setLastSavedId(id)
      setTimeout(() => setLastSavedId(null), 2000)
      
      // Limpa do estado de edição local após salvar com sucesso
      setEditValues(prev => {
        const next = { ...prev }
        delete next[categoria]
        return next
      })
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleSaveAll = async () => {
    const dirtyItems = comparativo.filter(c => c.isDirty)
    for (const item of dirtyItems) {
      await handleSaveOrcamento(item.categoria, item.planejado, item.id)
    }
    await refresh()
  }

  const chartData = {
    labels: comparativo.filter(c => c.realizado > 0 || c.planejado > 0).slice(0, 8).map(c => c.categoria),
    datasets: [
      {
        label: 'Planejado',
        data: comparativo.filter(c => c.realizado > 0 || c.planejado > 0).slice(0, 8).map(c => c.planejado),
        backgroundColor: 'rgba(203, 213, 225, 0.4)',
        borderRadius: 6
      },
      {
        label: 'Realizado',
        data: comparativo.filter(c => c.realizado > 0 || c.planejado > 0).slice(0, 8).map(c => c.realizado),
        backgroundColor: '#2d8c6f',
        borderRadius: 6
      }
    ]
  }

  const columns = [
    { header: 'Categoria', key: 'categoria', className: 'w-[200px]', render: (c: any) => (
      <span className="font-bold text-gray-700 text-xs">{c.categoria}</span>
    )},
    { header: 'Tipo', key: 'tipo', className: 'w-[100px]', render: (c: any) => (
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${c.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {c.tipo}
      </span>
    )},
    { header: 'Planejado (Orçamento)', key: 'planejado', className: 'w-[160px]', render: (c: any) => (
      <div className="flex items-center gap-2 relative group">
        <div className="relative">
          <input 
            type="number" 
            value={c.planejado}
            onChange={(e) => setEditValues(prev => ({ ...prev, [c.categoria]: Number(e.target.value) }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveOrcamento(c.categoria, c.planejado, c.id)}
            onBlur={() => c.isDirty && handleSaveOrcamento(c.categoria, c.planejado, c.id)}
            className={`w-28 bg-white border rounded-xl px-3 py-2 text-sm font-black transition-all outline-none ${
              savingIds.has(c.id) ? 'border-indigo-400 bg-indigo-50/30' : 
              lastSavedId === c.id ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10' :
              c.isDirty ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 focus:border-[#2d8c6f] focus:ring-4 focus:ring-[#2d8c6f]/5'
            }`}
          />
          {savingIds.has(c.id) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
               <RefreshCw size={12} className="text-indigo-500 animate-spin" />
            </div>
          )}
          {lastSavedId === c.id && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-in zoom-in duration-300">
               <CheckCircle2 size={12} className="text-emerald-500" />
            </div>
          )}
        </div>
        {c.isDirty && !savingIds.has(c.id) && (
          <button 
            onClick={() => handleSaveOrcamento(c.categoria, c.planejado, c.id)}
            className="p-2 bg-amber-500 text-white rounded-lg shadow-sm hover:bg-amber-600 transition-all active:scale-90"
          >
            <Save size={14} />
          </button>
        )}
      </div>
    )},
    { header: 'Realizado', key: 'realizado', className: 'w-[120px]', render: (c: any) => (
      <span className="font-bold text-gray-900 text-sm">{fmtR(c.realizado)}</span>
    )},
    { header: 'Variação', key: 'variacao', className: 'w-[100px]', render: (c: any) => (
      <div className={`flex items-center gap-1 font-black text-[10px] ${c.status === 'dentro' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {c.variacao > 0 ? '+' : ''}{fmtPct(c.variacao)}
        {c.status === 'dentro' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      </div>
    )}
  ]

  const hasDirtyItems = comparativo.some(c => c.isDirty)

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20">
      <div className="page-header flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Planejamento Orçamentário</h1>
            <p className="text-[11px] text-gray-500 font-medium">Controle mensal de metas e gastos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {hasDirtyItems && (
            <button 
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all animate-bounce"
            >
              <Save size={16} /> SALVAR ALTERAÇÕES
            </button>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-100 p-1 rounded-2xl gap-1">
          <button 
            onClick={() => setSelectedMes(m => m === 0 ? 11 : m - 1)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center">
            <Calendar size={14} className="text-[#2d8c6f]" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              {MESES[selectedMes]} {selectedAno}
            </span>
          </div>
          <button 
            onClick={() => setSelectedMes(m => m === 11 ? 0 : m + 1)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
          >
            <ChevronRight size={16} />
          </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Total Planejado" value={fmtR(comparativo.reduce((s, c) => s + c.planejado, 0))} icon={<Calendar size={20} />} category="info" />
        <KpiCard title="Total Realizado" value={fmtR(comparativo.reduce((s, c) => s + c.realizado, 0))} icon={<TrendingUp size={20} />} category="success" />
        <KpiCard 
          title="Saldo Orçamentário" 
          value={fmtR(comparativo.reduce((s, c) => s + (c.planejado - c.realizado), 0))} 
          icon={<TrendingDown size={20} />} 
          category="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Categorias em Destaque" subtitle="Realizado vs Planejado">
          <div className="h-[300px] mt-6">
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } }
              }} 
            />
          </div>
        </ChartCard>

        <div className="flex flex-col gap-4">
           <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Detalhamento por Categoria</h3>
           <DataTable columns={columns} data={comparativo} loading={loadFin || loadOrc} />
           <p className="text-[10px] text-gray-400 italic px-2">
             * Altere os valores na coluna "Planejado" para definir seu orçamento. O salvamento é automático ao tirar o foco do campo.
           </p>
        </div>
      </div>
    </div>
  )
}
