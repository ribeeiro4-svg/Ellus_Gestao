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
  Save
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
  const { orcamentos, loading: loadOrc, inserir, atualizar, remover } = useOrcamentos(selectedMes, selectedAno)
  const [editValues, setEditValues] = useState<Record<string, number>>({})

  // Extrair categorias reais dos lançamentos para sugerir orçamentos
  const todasCategorias = useMemo(() => {
    const cats = new Set<string>()
    lancamentos.forEach(l => cats.add(l.categoria))
    return Array.from(cats)
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
      const planejado = orc?.valor_planejado || 0
      const tipo = lancMes[0]?.tipo || 'despesa'

      return {
        id: orc?.id || `new-${cat}`,
        categoria: cat,
        tipo,
        planejado,
        realizado,
        variacao: planejado > 0 ? ((realizado - planejado) / planejado) * 100 : 0,
        status: realizado <= planejado ? 'dentro' : 'acima'
      }
    })
  }, [todasCategorias, lancamentos, orcamentos, selectedMes, selectedAno])

  const handleSaveOrcamento = async (categoria: string, valor: number, id: string) => {
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
  }

  const chartData = {
    labels: comparativo.slice(0, 6).map(c => c.categoria),
    datasets: [
      {
        label: 'Planejado',
        data: comparativo.slice(0, 6).map(c => c.planejado),
        backgroundColor: 'rgba(203, 213, 225, 0.5)',
        borderRadius: 4
      },
      {
        label: 'Realizado',
        data: comparativo.slice(0, 6).map(c => c.realizado),
        backgroundColor: '#2d8c6f',
        borderRadius: 4
      }
    ]
  }

  const columns = [
    { header: 'Categoria', key: 'categoria', render: (c: any) => (
      <span className="font-bold text-gray-700">{c.categoria}</span>
    )},
    { header: 'Tipo', key: 'tipo', render: (c: any) => (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${c.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {c.tipo}
      </span>
    )},
    { header: 'Planejado (Orçamento)', key: 'planejado', render: (c: any) => (
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          defaultValue={c.planejado}
          onBlur={(e) => handleSaveOrcamento(c.categoria, Number(e.target.value), c.id)}
          className="w-24 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none"
        />
      </div>
    )},
    { header: 'Realizado', key: 'realizado', render: (c: any) => (
      <span className="font-bold text-gray-900">{fmtR(c.realizado)}</span>
    )},
    { header: 'Variação', key: 'variacao', render: (c: any) => (
      <div className={`flex items-center gap-1 font-bold text-xs ${c.status === 'dentro' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {c.variacao > 0 ? '+' : ''}{fmtPct(c.variacao)}
        {c.status === 'dentro' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      </div>
    )}
  ]

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Target className="text-[#2d8c6f]" />
            Planejamento Orçamentário
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium font-italic">
            Acompanhe a relação entre o que foi planejado e o que foi realizado.
          </p>
        </div>
        
        <div className="flex items-center bg-white/80 backdrop-blur-md border border-white/60 p-1.5 rounded-2xl shadow-sm gap-2">
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
