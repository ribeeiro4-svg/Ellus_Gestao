'use client'
import React, { useState, useMemo } from 'react'
import { 
  Target, CheckCircle2, Save, TrendingUp, Activity,
  ArrowUpCircle, ArrowDownCircle, Trash2, Calendar, ArrowRightLeft, Users, Star
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { fmtR, MESES, getMesIdx, getAnoIdx, getBruto } from '@/lib/utils/formatters'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface MetasTabProps {
  selectedMes: number
  selectedAno: number
  reservaMeses: number
}

export default function MetasTab({ selectedMes, selectedAno, reservaMeses }: MetasTabProps) {
  const { 
    lancamentos, loading: loadFin, refresh: refetchFin, 
    inserirBulk 
  } = useFinanceiro()
  const { orcamentos, loading: loadOrc, inserir, atualizar, upsertBulk, refresh } = useOrcamentos(selectedMes, selectedAno)
  const { categorias } = useCategorias()
  const { diretoria, atualizar: atualizarDiretor } = useDiretoria()
  const { associados } = useAssociados()
  
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedNewCats, setSelectedNewCats] = useState<string[]>([])
  
  // Estados para Lançamento em Lote
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isConfirmLancarOpen, setIsConfirmLancarOpen] = useState(false)
  const [isLancing, setIsLancing] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceMonths, setRecurrenceMonths] = useState(12)

  const metrics = useDashboardMetrics(lancamentos, associados, orcamentos, [selectedMes], selectedAno)

  // Gerenciamento de Períodos ProLabore
  const [periodosMember, setPeriodosMember] = useState<any | null>(null)
  const [tempPeriodos, setTempPeriodos] = useState<any[]>([])

  // Sincroniza busca de lançamentos para o ano selecionado
  React.useEffect(() => {
    refetchFin(selectedAno)
  }, [selectedAno, refetchFin])

  const [favorites, setFavorites] = useState<string[]>([])
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem('planejamento_favorites_acprobec')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const toggleFavorite = (categoria: string) => {
    const newFavs = favorites.includes(categoria) 
      ? favorites.filter(f => f !== categoria) 
      : [...favorites, categoria]
    setFavorites(newFavs)
    localStorage.setItem('planejamento_favorites_acprobec', JSON.stringify(newFavs))
  }

  const totalProLabore = useMemo(() => {
    return diretoria.filter(d => d.status === 'ativo').reduce((s, d) => {
      const targetSerial = selectedAno * 12 + selectedMes
      const activePeriod = (d.periodos || []).find((p: any) => {
        const start = p.ano_inicio * 12 + p.mes_inicio
        const end = p.ano_fim !== undefined ? (p.ano_fim * 12 + (p.mes_fim ?? 11)) : 999999
        return targetSerial >= start && targetSerial <= end
      })
      const v = activePeriod?.valor || d.pro_labore_base || 0
      return Math.round((s + v) * 100) / 100
    }, 0)
  }, [diretoria, selectedMes, selectedAno])

  const totals = useMemo(() => {
    const planejadoReceita = orcamentos.filter(o => o.tipo === 'receita').reduce((s, o) => Math.round((s + o.valor_planejado) * 100) / 100, 0)
    const planejadoDespesa = orcamentos.filter(o => o.tipo === 'despesa').reduce((s, o) => Math.round((s + o.valor_planejado) * 100) / 100, 0)
    return { planejadoReceita, planejadoDespesa }
  }, [orcamentos])

  const comparativo = useMemo(() => {
    const orcCats = orcamentos.map(o => o.categoria)
    const realCats = Array.from(new Set(lancamentos.filter(l => getMesIdx(l.data) === selectedMes && getAnoIdx(l.data) === selectedAno).map(l => l.categoria)))
    const editCats = Object.keys(editValues)
    const todasMes = Array.from(new Set([...orcCats, ...realCats, ...editCats])).sort()

    return todasMes.map(cat => {
      const lancMes = lancamentos.filter(l => l.categoria === cat && getMesIdx(l.data) === selectedMes && getAnoIdx(l.data) === selectedAno)
      const realizado = lancMes.reduce((sum, l) => Math.round((sum + getBruto(l)) * 100) / 100, 0)
      const provisionado = lancMes.filter(l => l.status === 'aberto' || l.status === 'atrasado').reduce((sum, l) => Math.round((sum + getBruto(l)) * 100) / 100, 0)
      const orc = orcamentos.find(o => o.categoria === cat)
      const planejado = editValues[cat] !== undefined ? editValues[cat] : (orc?.valor_planejado || 0)
      const catConfig = categorias.find(c => c.nome === cat)
      const tipo = catConfig?.tipo || lancMes[0]?.tipo || (cat.toLowerCase().includes('receita') || cat.toLowerCase().includes('adesão') ? 'receita' : 'despesa')

      return { id: orc?.id || cat, categoria: cat, tipo, planejado, realizado, provisionado, diferenca: Math.round((realizado - planejado) * 100) / 100, isDirty: editValues[cat] !== undefined }
    }).filter(item => item.realizado > 0 || item.planejado > 0 || item.isDirty)
  }, [lancamentos, orcamentos, selectedMes, selectedAno, editValues, categorias])

  const handleSaveOrcamento = async (categoria: string, valor: number, id?: string) => {
    const isNew = !orcamentos.find(o => o.id === id)
    if (isNew) {
      const cat = categorias.find(c => c.nome === categoria)
      await inserir({ categoria, tipo: cat?.tipo || 'despesa', valor_planejado: valor, mes: selectedMes, ano: selectedAno })
    } else {
      await atualizar(id!, { valor_planejado: valor })
    }
    const newEdits = { ...editValues }; delete newEdits[categoria]; setEditValues(newEdits)
  }

  const handleLancarBulk = async () => {
    if (selectedCategories.length === 0) return
    setIsLancing(true)
    try {
      const itemsToLanch = comparativo.filter(c => selectedCategories.includes(c.categoria))
      const batchFinanceiro: any[] = []
      const batchOrcamentos: any[] = []
      const numMonths = isRecurring ? Math.max(1, recurrenceMonths) : 1
      
      for (let i = 0; i < numMonths; i++) {
        const targetDate = new Date(selectedAno, selectedMes + i, 10)
        const tMes = targetDate.getMonth()
        const tAno = targetDate.getFullYear()
        const mm = String(tMes + 1).padStart(2, '0')
        const dateStr = `${tAno}-${mm}-10`

        itemsToLanch.forEach(item => {
          batchFinanceiro.push({
            tipo: item.tipo,
            descricao: `PLANEJAMENTO - ${mm}/${tAno} - ${item.categoria}`,
            valor: item.planejado,
            data: dateStr,
            status: 'aberto',
            categoria: item.categoria,
            competencia_mes: tMes,
            competencia_ano: tAno
          })
          batchOrcamentos.push({
            categoria: item.categoria,
            tipo: item.tipo,
            valor_planejado: item.planejado,
            mes: tMes,
            ano: tAno
          })
        })

        const reservaIdeal = Math.round((totals.planejadoDespesa * reservaMeses) * 100) / 100
        batchFinanceiro.push({
          tipo: 'despesa',
          descricao: `PLANEJAMENTO - ${mm}/${tAno} - RESERVA DE EMERGÊNCIA`,
          valor: reservaIdeal,
          data: dateStr,
          status: 'aberto',
          categoria: 'RESERVA DE EMERGÊNCIA',
          competencia_mes: tMes,
          competencia_ano: tAno
        })
        batchOrcamentos.push({
          categoria: 'RESERVA DE EMERGÊNCIA',
          tipo: 'despesa',
          valor_planejado: reservaIdeal,
          mes: tMes,
          ano: tAno
        })
      }

      await inserirBulk(batchFinanceiro)
      await upsertBulk(batchOrcamentos)
      alert('Planejamento lançado com sucesso!')
      setSelectedCategories([])
      setIsConfirmLancarOpen(false)
      refetchFin(selectedAno)
      refresh()
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsLancing(false)
    }
  }

  const columns = useMemo(() => [
    { 
      header: 'Categoria', 
      key: 'categoria', 
      render: (i: any) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toggleFavorite(i.categoria)}
            className={`transition-colors flex-shrink-0 ${favorites.includes(i.categoria) ? 'text-amber-400 hover:text-amber-500' : 'text-slate-200 hover:text-amber-400'}`}
            title="Favoritar"
          >
            <Star size={14} fill={favorites.includes(i.categoria) ? 'currentColor' : 'none'} />
          </button>
          <span className="text-xs font-bold text-slate-700">{i.categoria}</span>
        </div>
      ) 
    },
    { 
      header: 'Planejado', 
      key: 'planejado', 
      render: (i: any) => (
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            value={i.planejado} 
            onChange={(e) => setEditValues({ ...editValues, [i.categoria]: Number(e.target.value) })}
            className={`w-28 px-2 py-1.5 rounded-xl text-xs font-black outline-none transition-all ${i.isDirty ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-200' : 'bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 ring-emerald-100'}`}
          />
          {i.isDirty && <button onClick={() => handleSaveOrcamento(i.categoria, i.planejado, i.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"><Save size={14}/></button>}
        </div>
      )
    },
    { header: 'Lançamentos', key: 'provisionado', render: (i: any) => <span className={`text-xs font-black ${i.provisionado > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{fmtR(i.provisionado)}</span> },
    { header: 'Realizado', key: 'realizado', render: (i: any) => <span className={`text-xs font-black ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-slate-600'}`}>{fmtR(i.realizado)}</span> },
    { 
      header: 'Desvio', 
      key: 'desvio', 
      render: (i: any) => {
        const diff = i.tipo === 'receita' ? (i.planejado - i.realizado) : (i.realizado - i.planejado)
        return <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{diff > 0 ? '+' : ''}{fmtR(Math.round(diff * 100) / 100)}</span>
      }
    }
  ], [editValues, selectedCategories, favorites])

  const filteredComparativo = useMemo(() => {
    return showOnlyFavorites 
      ? comparativo.filter(c => favorites.includes(c.categoria))
      : comparativo
  }, [comparativo, showOnlyFavorites, favorites])

  const receitasChartData = { labels: comparativo.filter(c => c.tipo === 'receita').map(c => c.categoria), datasets: [{ label: 'Planejado', data: comparativo.filter(c => c.tipo === 'receita').map(c => c.planejado), backgroundColor: 'rgba(59, 130, 246, 0.4)', borderRadius: 4 }, { label: 'Realizado', data: comparativo.filter(c => c.tipo === 'receita').map(c => c.realizado), backgroundColor: '#10b981', borderRadius: 4 }] }
  
  const expenseImpactData = useMemo(() => {
    const totalRevenue = totals.planejadoReceita || 1
    const expItems = comparativo.filter(c => c.tipo === 'despesa' && c.planejado > 0)
    return {
      labels: expItems.map(c => `${c.categoria} (${((c.planejado / totalRevenue) * 100).toFixed(1)}%)`),
      datasets: [{
        data: expItems.map(c => c.planejado),
        backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#3b82f6', '#06b6d4', '#14b8a6', '#f97316'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    }
  }, [comparativo, totals.planejadoReceita])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-stretch gap-2 w-full relative z-[60] overflow-visible">
        {[
          { label: 'Ingressos Projetados', value: fmtR(totals.planejadoReceita), color: 'text-emerald-600' },
          { label: 'Dispêndios Projetados', value: fmtR(totals.planejadoDespesa), color: 'text-rose-600' },
          { label: 'Superávit Alvo', value: fmtR(Math.round((totals.planejadoReceita - totals.planejadoDespesa) * 100) / 100), color: 'text-blue-600' },
          { label: 'Pró-labore', value: fmtR(totalProLabore), color: 'text-purple-600' },
          { label: 'Reserva Ideal', value: fmtR(Math.round((totals.planejadoDespesa * reservaMeses) * 100) / 100), color: 'text-indigo-600' },
          { label: 'Saldo Real', value: fmtR(comparativo.reduce((s, c) => Math.round((s + (c.tipo === 'receita' ? c.realizado : -c.realizado)) * 100) / 100, 0)), color: 'text-emerald-600', isMain: true }
        ].map(k => (
          <div key={k.label} className={`bg-white border border-slate-100 rounded-2xl p-4 flex-1 min-w-[140px] shadow-sm transition-all hover:shadow-md ${k.isMain ? 'ring-2 ring-emerald-50 border-emerald-200 bg-emerald-50/10' : ''}`}>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{k.label}</div>
            <div className={`text-base font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Gráficos no topo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Metas Financeiras" subtitle="Realizado vs Planejado">
          <div className="h-[210px] mt-4">
            <Bar data={receitasChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9 } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }} />
          </div>
        </ChartCard>

        <ChartCard title="📉 Impacto nos Ingressos" subtitle="Consumo do Faturamento por Categoria">
          <div className="h-[210px] mt-4">
            {totals.planejadoDespesa > 0 ? (
              <Doughnut data={expenseImpactData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } } }} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 italic">
                <Activity size={32} className="opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest">Nenhum dispêndio planejado</span>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Tabela de Orçamento abaixo */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orçamento Mensal</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Superávit Projetado (%)</span>
            {selectedCategories.length > 0 && (
              <button onClick={() => setIsConfirmLancarOpen(true)} className="flex items-center gap-2 text-[9px] font-black text-white bg-emerald-500 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                <TrendingUp size={14} /> LANÇAR PLANEJAMENTO ({selectedCategories.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${showOnlyFavorites ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <Star size={12} fill={showOnlyFavorites ? 'currentColor' : 'none'} />
              {showOnlyFavorites ? 'FAVORITAS' : 'TODAS'}
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all">+ CATEGORIA</button>
          </div>
        </div>
        <DataTable columns={columns} data={filteredComparativo} loading={loadFin || loadOrc} selectedIds={selectedCategories} onSelectChange={setSelectedCategories} idKey="categoria" />
      </div>

      {/* Modais */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
             <h3 className="text-xl font-black text-slate-800 text-center mb-2 tracking-tight">Nova Meta de Categoria</h3>
             <p className="text-center text-xs text-slate-500 mb-6 font-bold">Selecione uma ou mais categorias para adicionar</p>
             
             <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
               {categorias.filter(c => !comparativo.some(comp => comp.categoria === c.nome)).map(c => (
                 <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                   <input 
                     type="checkbox" 
                     className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                     checked={selectedNewCats.includes(c.id)}
                     onChange={(e) => {
                       if (e.target.checked) setSelectedNewCats([...selectedNewCats, c.id]);
                       else setSelectedNewCats(selectedNewCats.filter(id => id !== c.id));
                     }}
                   />
                   <span className="text-sm font-bold text-slate-700">{c.nome}</span>
                 </label>
               ))}
               {categorias.filter(c => !comparativo.some(comp => comp.categoria === c.nome)).length === 0 && (
                 <div className="text-center p-6 text-slate-400 text-sm font-bold">
                    Todas as categorias já estão no planejamento.
                 </div>
               )}
             </div>
             
             <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
               <button onClick={() => { setIsAddModalOpen(false); setSelectedNewCats([]); }} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
               <button 
                 onClick={() => {
                   const newEdits = { ...editValues };
                   for (const id of selectedNewCats) {
                     const cat = categorias.find(c => c.id === id);
                     if (cat) newEdits[cat.nome] = 0;
                   }
                   setEditValues(newEdits);
                   setIsAddModalOpen(false);
                   setSelectedNewCats([]);
                 }}
                 disabled={selectedNewCats.length === 0} 
                 className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black disabled:opacity-50 transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-200"
               >
                 Adicionar ({selectedNewCats.length})
               </button>
             </div>
           </div>
        </div>
      )}

      {isConfirmLancarOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-100 overflow-hidden">
             <h3 className="text-xl font-black text-slate-800 text-center mb-6 tracking-tight">Lançar Planejamento</h3>
             <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} className="w-5 h-5 rounded-lg text-emerald-500" />
                  <span className="text-xs font-black text-slate-700 uppercase">Recorrente?</span>
                </label>
                {isRecurring && (
                  <input type="number" value={recurrenceMonths} onChange={e => setRecurrenceMonths(Number(e.target.value))} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold" />
                )}
             </div>
             <div className="flex gap-3">
               <button onClick={() => setIsConfirmLancarOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold">Cancelar</button>
               <button onClick={handleLancarBulk} disabled={isLancing} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black">{isLancing ? 'Processando...' : 'Lançar Agora'}</button>
             </div>
           </div>
        </div>
      )}

      {periodosMember && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           {/* Lógica de Períodos Simplificada para o componente */}
           <div className="bg-white p-8 rounded-[32px] w-full max-w-xl">
             <button onClick={() => setPeriodosMember(null)}>Fechar</button>
           </div>
         </div>
      )}
    </div>
  )
}
