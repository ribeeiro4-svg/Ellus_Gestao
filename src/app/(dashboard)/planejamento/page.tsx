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
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { useCategorias } from '@/lib/hooks/useCategorias'
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
  const { orcamentos, loading: loadOrc, inserir, atualizar, remover, refresh } = useOrcamentos(selectedMes, selectedAno)
  const { categorias, loading: loadCats } = useCategorias()
  
  // Controle de edições e estados de salvamento
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const comparativo = useMemo(() => {
    const orcCats = orcamentos.map(o => o.categoria)
    const realCats = Array.from(new Set(
      lancamentos
        .filter(l => {
          const d = new Date(l.data)
          return d.getMonth() === selectedMes && d.getFullYear() === selectedAno
        })
        .map(l => l.categoria)
    ))

    const todasMes = Array.from(new Set([...orcCats, ...realCats])).sort()

    return todasMes.map(cat => {
      const lancMes = lancamentos.filter(l => 
        l.categoria === cat && 
        new Date(l.data).getMonth() === selectedMes &&
        new Date(l.data).getFullYear() === selectedAno
      )
      
      const realizado = lancMes.reduce((sum, l) => sum + l.valor, 0)
      const orc = orcamentos.find(o => o.categoria === cat)
      const planejado = editValues[cat] !== undefined ? editValues[cat] : (orc?.valor_planejado || 0)
      
      const catConfig = categorias.find(c => c.nome === cat)
      const tipo = catConfig?.tipo || lancMes[0]?.tipo || (cat.toLowerCase().includes('receita') || cat.toLowerCase().includes('adesão') ? 'receita' : 'despesa')

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
  }, [lancamentos, orcamentos, categorias, selectedMes, selectedAno, editValues])

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

  const handleRemoverOrcamento = async (item: any) => {
    if (confirm(`Remover "${item.categoria}" do orçamento deste mês?`)) {
      if (!item.id.startsWith('new-')) {
        await remover(item.id)
      }
      setEditValues(prev => {
        const next = { ...prev }
        delete next[item.categoria]
        return next
      })
    }
  }

  const handleAddItem = async (data: any) => {
    const cat = categorias.find(c => c.id === data.categoria_id)
    if (cat) {
      await inserir({
        mes: selectedMes,
        ano: selectedAno,
        categoria: cat.nome,
        tipo: cat.tipo,
        valor_planejado: 0
      })
      setIsAddModalOpen(false)
    }
  }

  const receitasChartData = {
    labels: comparativo.filter(c => c.tipo === 'receita' && (c.realizado > 0 || c.planejado > 0)).slice(0, 8).map(c => c.categoria),
    datasets: [
      {
        label: 'Planejado',
        data: comparativo.filter(c => c.tipo === 'receita' && (c.realizado > 0 || c.planejado > 0)).slice(0, 8).map(c => c.planejado),
        backgroundColor: 'rgba(209, 250, 229, 0.6)',
        borderRadius: 6
      },
      {
        label: 'Realizado',
        data: comparativo.filter(c => c.tipo === 'receita' && (c.realizado > 0 || c.planejado > 0)).slice(0, 8).map(c => c.realizado),
        backgroundColor: '#2d8c6f',
        borderRadius: 6
      }
    ]
  }

  const despesasChartData = {
    labels: comparativo.filter(c => c.tipo === 'despesa' && (c.realizado > 0 || c.planejado > 0)).slice(0, 8).map(c => c.categoria),
    datasets: [
      {
        label: 'Planejado',
        data: comparativo.filter(c => c.tipo === 'despesa' && (c.realizado > 0 || c.planejado > 0)).slice(0, 8).map(c => c.planejado),
        backgroundColor: 'rgba(255, 228, 230, 0.6)',
        borderRadius: 6
      },
      {
        label: 'Realizado',
        data: comparativo.filter(c => c.tipo === 'despesa' && (c.realizado > 0 || c.planejado > 0)).slice(0, 8).map(c => c.realizado),
        backgroundColor: '#e11d48',
        borderRadius: 6
      }
    ]
  }

  const columns = [
    { header: 'Categoria', key: 'categoria', className: 'w-[200px]', render: (c: any) => (
      <span className="font-bold text-gray-700 text-xs">{c.categoria}</span>
    )},
    { header: 'Tipo', key: 'tipo', className: 'w-[80px]', render: (c: any) => (
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${c.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {c.tipo}
      </span>
    )},
    { header: 'Planejado', key: 'planejado', className: 'w-[160px]', render: (c: any) => (
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
          {savingIds.has(c.id) && <RefreshCw size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />}
          {lastSavedId === c.id && <CheckCircle2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in" />}
        </div>
        {c.isDirty && !savingIds.has(c.id) && (
          <button onClick={() => handleSaveOrcamento(c.categoria, c.planejado, c.id)} className="p-2 bg-amber-500 text-white rounded-lg"><Save size={14} /></button>
        )}
      </div>
    )},
    { header: 'Realizado', key: 'realizado', className: 'w-[120px]', render: (c: any) => (
      <span className="font-bold text-gray-900 text-sm">{fmtR(c.realizado)}</span>
    )},
    { header: 'Variação', key: 'variacao', className: 'w-[80px]', render: (c: any) => (
      <div className={`flex items-center gap-1 font-black text-[10px] ${c.status === 'dentro' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {c.variacao > 0 ? '+' : ''}{fmtPct(c.variacao)}
      </div>
    )},
    { header: '', key: 'actions', className: 'w-[40px]', render: (c: any) => (
      <button 
        onClick={() => handleRemoverOrcamento(c)}
        className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
        title="Remover do Orçamento"
      >
        <Trash2 size={14} />
      </button>
    )}
  ]

  const hasDirtyItems = comparativo.some(c => c.isDirty)
  const catsDisponiveis = categorias
    .filter(cat => !comparativo.some(item => item.categoria === cat.nome))
    .map(cat => ({ value: cat.id, label: `${cat.nome} (${cat.tipo})` }))

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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-gray-700 rounded-2xl font-bold text-xs hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
          >
            <Plus size={16} /> INCLUIR ITEM
          </button>

          {hasDirtyItems && (
            <button 
              onClick={async () => {
                const dirtyItems = comparativo.filter(c => c.isDirty)
                for (const item of dirtyItems) {
                  await handleSaveOrcamento(item.categoria, item.planejado, item.id)
                }
                refresh()
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all animate-bounce"
            >
              <Save size={16} /> SALVAR ALTERAÇÕES
            </button>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-100 p-1 rounded-2xl gap-1">
            <button onClick={() => setSelectedMes(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ChevronLeft size={16} /></button>
            <div className="flex items-center gap-2 px-4 min-w-[140px] justify-center">
              <Calendar size={14} className="text-[#2d8c6f]" /><span className="text-sm font-bold text-gray-700 uppercase tracking-widest">{MESES[selectedMes]} {selectedAno}</span>
            </div>
            <button onClick={() => setSelectedMes(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Balanço Planejado" value={fmtR(comparativo.reduce((s, c) => s + (c.tipo === 'receita' ? c.planejado : -c.planejado), 0))} icon={<Calendar size={20} />} category="info" />
        <KpiCard title="Balanço Realizado" value={fmtR(comparativo.reduce((s, c) => s + (c.tipo === 'receita' ? c.realizado : -c.realizado), 0))} icon={<TrendingUp size={20} />} category="success" />
        <KpiCard title="Diferença Final" value={fmtR(comparativo.reduce((s, c) => s + (c.tipo === 'receita' ? (c.realizado - c.planejado) : (c.planejado - c.realizado)), 0))} icon={<TrendingDown size={20} />} category="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <ChartCard title="Metas de Receita" subtitle="Realizado vs Planejado">
            <div className="h-[220px] mt-4">
              <Bar 
                data={receitasChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </ChartCard>

          <ChartCard title="Controle de Despesas" subtitle="Realizado vs Planejado">
            <div className="h-[220px] mt-4">
              <Bar 
                data={despesasChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </ChartCard>
        </div>

        <div className="flex flex-col gap-4">
           <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Detalhamento por Categoria</h3>
           <DataTable columns={columns} data={comparativo} loading={loadFin || loadOrc || loadCats} />
           <p className="text-[10px] text-gray-400 italic px-2">
             * Use "+ Incluir Item" para adicionar categorias padronizadas. O salvamento é automático.
           </p>
        </div>
      </div>

      <CrudModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Incluir Categoria no Orçamento"
        onSubmit={handleAddItem}
        fields={[
          { 
            name: 'categoria_id', 
            label: 'Selecione a Categoria', 
            type: 'select', 
            required: true, 
            options: catsDisponiveis 
          }
        ]}
      />
    </div>
  )
}
