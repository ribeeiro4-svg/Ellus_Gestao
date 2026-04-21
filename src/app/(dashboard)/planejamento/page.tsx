'use client'

import React, { useState, useMemo } from 'react'
import { 
  Calendar, Target, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  TrendingDown, TrendingUp, Save, RefreshCw, Plus, Trash2, Users, Activity,
  ArrowUpCircle, ArrowDownCircle, ArrowRightLeft
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import CrudModal from '@/components/ui/CrudModal'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { fmtR, MESES, fmtPct, getMesIdx, getAnoIdx, getBruto } from '@/lib/utils/formatters'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController)

export default function PlanejamentoPage() {
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth())
  const [selectedAno] = useState(new Date().getFullYear())
  
  const { 
    lancamentos, loading: loadFin, refresh: refetchFin, 
    inserirBulk 
  } = useFinanceiro()
  const { orcamentos, loading: loadOrc, inserir, atualizar, remover, refresh } = useOrcamentos(selectedMes, selectedAno)
  const { categorias } = useCategorias()
  const { diretoria, atualizar: atualizarDiretor } = useDiretoria()
  
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [reservaMeses, setReservaMeses] = useState(6)
  
  // Estados para Lançamento em Lote
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isConfirmLancarOpen, setIsConfirmLancarOpen] = useState(false)
  const [isLancing, setIsLancing] = useState(false)

  // Gerenciamento de Períodos ProLabore
  const [periodosMember, setPeriodosMember] = useState<any | null>(null)
  const [tempPeriodos, setTempPeriodos] = useState<any[]>([])

  // Sincroniza busca de lançamentos para o ano selecionado
  React.useEffect(() => {
    refetchFin(selectedAno)
  }, [selectedAno, refetchFin])

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
    const todasMes = Array.from(new Set([...orcCats, ...realCats])).sort()

    return todasMes.map(cat => {
      const lancMes = lancamentos.filter(l => l.categoria === cat && getMesIdx(l.data) === selectedMes && getAnoIdx(l.data) === selectedAno)
      const realizado = lancMes.reduce((sum, l) => Math.round((sum + getBruto(l)) * 100) / 100, 0)
      const orc = orcamentos.find(o => o.categoria === cat)
      const planejado = editValues[cat] !== undefined ? editValues[cat] : (orc?.valor_planejado || 0)
      const catConfig = categorias.find(c => c.nome === cat)
      const tipo = catConfig?.tipo || lancMes[0]?.tipo || (cat.toLowerCase().includes('receita') || cat.toLowerCase().includes('adesão') ? 'receita' : 'despesa')

      return { id: orc?.id || cat, categoria: cat, tipo, planejado, realizado, diferenca: Math.round((realizado - planejado) * 100) / 100, isDirty: editValues[cat] !== undefined }
    })
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
      const mm = String(selectedMes + 1).padStart(2, '0')
      const targetDate = `${selectedAno}-${mm}-10`
      
      const batch: any[] = itemsToLanch.map(item => ({
        tipo: item.tipo,
        descricao: `PLANEJAMENTO - ${mm}/${selectedAno} - ${item.categoria}`,
        valor: item.planejado,
        data: targetDate,
        status: 'aberto',
        categoria: item.categoria,
        competencia_mes: selectedMes,
        competencia_ano: selectedAno
      }))

      // Adiciona Reserva de Emergência
      const reservaIdeal = Math.round((totals.planejadoDespesa * reservaMeses) * 100) / 100
      batch.push({
        tipo: 'despesa',
        descricao: `PLANEJAMENTO - ${mm}/${selectedAno} - RESERVA DE EMERGÊNCIA`,
        valor: reservaIdeal,
        data: targetDate,
        status: 'aberto',
        categoria: 'RESERVA DE EMERGÊNCIA',
        competencia_mes: selectedMes,
        competencia_ano: selectedAno
      })

      const res = await inserirBulk(batch)
      if (res.error) alert(`Erro ao lançar: ${res.error}`)
      else {
        alert(`${batch.length} planejamentos lançados com sucesso no Financeiro!`)
        setSelectedCategories([])
        setIsConfirmLancarOpen(false)
        if (refetchFin) refetchFin(selectedAno)
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    } finally {
      setIsLancing(false)
    }
  }

  const columns = useMemo(() => [
    { header: 'Categoria', key: 'categoria', render: (i: any) => <span className="text-xs font-bold text-slate-700">{i.categoria}</span> },
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
    { header: 'Realizado', key: 'realizado', render: (i: any) => <span className={`text-xs font-black ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-slate-600'}`}>{fmtR(i.realizado)}</span> },
    { 
      header: 'Desvio', 
      key: 'desvio', 
      render: (i: any) => {
        const diff = i.tipo === 'receita' ? (i.realizado - i.planejado) : (i.planejado - i.realizado)
        return <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{diff > 0 ? '+' : ''}{fmtR(Math.round(diff * 100) / 100)}</span>
      }
    }
  ], [editValues, selectedCategories])

  const receitasChartData = { labels: comparativo.filter(c => c.tipo === 'receita').map(c => c.categoria), datasets: [{ label: 'Planejado', data: comparativo.filter(c => c.tipo === 'receita').map(c => c.planejado), backgroundColor: 'rgba(59, 130, 246, 0.4)', borderRadius: 4 }, { label: 'Realizado', data: comparativo.filter(c => c.tipo === 'receita').map(c => c.realizado), backgroundColor: '#10b981', borderRadius: 4 }] }
  const despesasChartData = { labels: comparativo.filter(c => c.tipo === 'despesa').map(c => c.categoria), datasets: [{ label: 'Planejado', data: comparativo.filter(c => c.tipo === 'despesa').map(c => c.planejado), backgroundColor: 'rgba(99, 102, 241, 0.4)', borderRadius: 4 }, { label: 'Realizado', data: comparativo.filter(c => c.tipo === 'despesa').map(c => c.realizado), backgroundColor: '#6366f1', borderRadius: 4 }] }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 animate-pulse-slow">
            <Target size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Planejamento Orçamentário</h1>
            <p className="text-xs text-slate-400 font-black uppercase tracking-[2px]">Gestão de Metas — ACPROBEC</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Novo Local para Meses de Reserva - Ampliado */}
          <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 p-2 rounded-2xl">
            <div className="pl-3 py-1 flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Meta de Reserva</span>
              <span className="text-[9px] font-bold text-slate-400">Meses de segurança</span>
            </div>
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
               <button onClick={() => setReservaMeses(Math.max(1, reservaMeses - 1))} className="p-3 hover:bg-slate-50 text-indigo-600 transition-colors">－</button>
               <input 
                 type="number" 
                 value={reservaMeses} 
                 onChange={e => setReservaMeses(Number(e.target.value))} 
                 className="w-12 text-center font-black text-indigo-700 bg-transparent outline-none"
               />
               <button onClick={() => setReservaMeses(reservaMeses + 1)} className="p-3 hover:bg-slate-50 text-indigo-600 transition-colors">＋</button>
            </div>
          </div>

          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl gap-1 shadow-sm h-14">
            <button onClick={() => setSelectedMes(m => m === 0 ? 11 : m - 1)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-3 px-6 min-w-[180px] justify-center border-x border-slate-100">
              <Calendar size={18} className="text-indigo-500" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{MESES[selectedMes]} {selectedAno}</span>
            </div>
            <button onClick={() => setSelectedMes(m => m === 11 ? 0 : m + 1)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 relative z-[60] overflow-visible">
        <KpiCard 
          title="Receitas Projetadas" 
          value={fmtR(totals.planejadoReceita)} 
          icon={<ArrowUpCircle size={20} />} 
          category="success" 
          explanation={{
            description: "Soma de todas as metas de faturamento e mensalidades definidas para este mês.",
            formula: "Σ(Metas de Receita configuradas)",
            example: "Se a meta de mensalidades é 9k e a de adesões é 1k, a projeção total é de 10k."
          }}
        />
        <KpiCard 
          title="Despesas Projetadas" 
          value={fmtR(totals.planejadoDespesa)} 
          icon={<ArrowDownCircle size={20} />} 
          category="error" 
          explanation={{
            description: "Limite máximo de gastos planejado para todas as categorias de despesa no mês.",
            formula: "Σ(Metas de Despesa configuradas)",
            example: "Inclui teto para suprimentos, infraestrutura e custos operacionais."
          }}
        />
        <KpiCard 
          title="Superávit Alvo" 
          value={fmtR(Math.round((totals.planejadoReceita - totals.planejadoDespesa) * 100) / 100)} 
          icon={<CheckCircle2 size={20} />} 
          category="info" 
          explanation={{
            description: "O superávit ou déficit planejado para o fechamento do mês (Meta de Lucro).",
            formula: "Receita Projetada - Despesa Projetada",
            example: "Planejando 10k e gastando 8k, o balanço final alvo é 2k positivo."
          }}
        />
        <KpiCard 
          title="Pró-labore" 
          value={fmtR(totalProLabore)} 
          icon={<Users size={20} />} 
          category="purple" 
          explanation={{
            description: "Soma dos custos de pró-labore dos diretores ativos, respeitando períodos e valores base.",
            formula: "Σ(Valor do Período Ativo || Valor Base)",
            example: "Um diretor com período de R$ 1.500 no mês atual anula o seu valor base padrão."
          }}
        />
        <KpiCard 
          title="Reserva Ideal" 
          value={fmtR(Math.round((totals.planejadoDespesa * reservaMeses) * 100) / 100)} 
          icon={<Activity size={20} />} 
          category="indigo" 
          explanation={{
            description: "Montante necessário em caixa para cobrir a operação em caso de faturamento zerado.",
            formula: "Despesas Projetadas × Meses de Meta",
            example: "Se o gasto é 3k e a meta são 6 meses, a reserva ideal é de 18k."
          }}
        />
        <KpiCard 
          title="Saldo Real" 
          value={fmtR(comparativo.reduce((s, c) => Math.round((s + (c.tipo === 'receita' ? c.realizado : -c.realizado)) * 100) / 100, 0))} 
          icon={<TrendingUp size={20} />} 
          category="success" 
          explanation={{
            description: "O resultado financeiro de fato ocorrido (entradas - saídas brutas).",
            formula: "Receitas Reais - Despesas Reais",
            example: "Bate com o valor do Dashboard, filtrado para o mês específico selecionado."
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6"><ChartCard title="Metas Financeiras" subtitle="Realizado vs Planejado"><div className="h-[210px] mt-4"><Bar data={receitasChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9 } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }} /></div></ChartCard></div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orçamento Mensal</h3>
              {selectedCategories.length > 0 && (
                <button 
                  onClick={() => setIsConfirmLancarOpen(true)}
                  className="flex items-center gap-2 text-[9px] font-black text-white bg-emerald-500 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 animate-in zoom-in-95"
                >
                  <TrendingUp size={14} /> LANÇAR PLANEJAMENTO ({selectedCategories.length})
                </button>
              )}
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all">+ CATEGORIA</button>
          </div>
          <DataTable 
            columns={columns} 
            data={comparativo} 
            loading={loadFin || loadOrc} 
            selectedIds={selectedCategories}
            onSelectChange={setSelectedCategories}
            idKey="categoria"
          />
        </div>
      </div>

      {periodosMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div><h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Calendar className="text-emerald-500" /> Períodos de Pró-labore</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{periodosMember.nome}</p></div>
              <button onClick={() => setPeriodosMember(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">✕</button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
              {tempPeriodos.map((p, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-white pb-2"><span className="text-[10px] font-black text-slate-300">VALOR R$</span><input type="number" value={p.valor} onChange={e => { const newP = [...tempPeriodos]; newP[idx].valor = Number(e.target.value); setTempPeriodos(newP) }} className="w-full bg-transparent border-none outline-none font-black text-slate-700 text-sm" /><button onClick={() => setTempPeriodos(tempPeriodos.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button></div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Início</span><div className="flex gap-1"><select value={p.mes_inicio} onChange={e => { const newP = [...tempPeriodos]; newP[idx].mes_inicio = Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-white rounded-lg border-none outline-none">{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><select value={p.ano_inicio} onChange={e => { const newP = [...tempPeriodos]; newP[idx].ano_inicio = Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-white rounded-lg border-none outline-none">{[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}</select></div></div>
                    <ArrowRightLeft size={12} className="text-slate-200 mt-4" />
                    <div className="flex-1 flex flex-col gap-1"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fim (Op)</span><div className="flex gap-1"><select value={p.mes_fim ?? ''} onChange={e => { const newP = [...tempPeriodos]; newP[idx].mes_fim = e.target.value === '' ? undefined : Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-white rounded-lg border-none outline-none"><option value="">∞</option>{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select><select value={p.ano_fim ?? ''} onChange={e => { const newP = [...tempPeriodos]; newP[idx].ano_fim = e.target.value === '' ? undefined : Number(e.target.value); setTempPeriodos(newP) }} className="text-[10px] font-bold p-1 bg-white rounded-lg border-none outline-none"><option value="">∞</option>{[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}</select></div></div>
                  </div>
                </div>
              ))}
              <button onClick={() => setTempPeriodos([...tempPeriodos, { valor: 0, mes_inicio: selectedMes, ano_inicio: selectedAno }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-500 transition-all">+ Adicionar Faixa de Valor</button>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3"><button onClick={() => setPeriodosMember(null)} className="flex-1 py-3 bg-white text-slate-500 font-bold rounded-2xl text-xs hover:bg-slate-100 transition-colors">Fechar</button><button onClick={async () => { await atualizarDiretor(periodosMember.id, { periodos: tempPeriodos }); setPeriodosMember(null) }} className="flex-[2] py-3 bg-emerald-500 text-white font-black rounded-2xl text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200">Salvar Mudanças</button></div>
          </div>
        </div>
      )}

      <CrudModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Meta de Categoria" onSubmit={async (data) => { const cat = categorias.find(c => c.id === data.categoria_id); if(cat) await handleSaveOrcamento(cat.nome, 0); setIsAddModalOpen(false) }} fields={[{ name: 'categoria_id', label: 'Tipo de Categoria', type: 'select', required: true, options: categorias.map(c => ({ value: c.id, label: c.nome })) }]} />

      <ConfirmModal 
        isOpen={isConfirmLancarOpen}
        onClose={() => setIsConfirmLancarOpen(false)}
        onConfirm={handleLancarBulk}
        title="Lançar Planejamento"
        message={`Você deseja lançar os ${selectedCategories.length} orçamentos selecionados + a Reserva de Emergência para o dia 10 de ${MESES[selectedMes]}? Isso criará novos lançamentos provisionados no seu fluxo financeiro.`}
        confirmText={isLancing ? 'Lançando...' : 'Sim, Lançar agora'}
        type="info"
      />
    </div>
  )
}
