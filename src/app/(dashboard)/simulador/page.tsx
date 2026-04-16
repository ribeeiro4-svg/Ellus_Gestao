'use client'
import React, { useState } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  UserPlus,
  Calendar,
  ChevronRight,
  Clock
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import { useProjecao } from '@/lib/hooks/useProjecao'
import { fmtR, fmtPct, MESES } from '@/lib/utils/formatters'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController)

const ANOS = [2024, 2025, 2026, 2027, 2028]

export default function SimuladorPage() {
  const { cenario, setCenario, salvarCenario, calculos, loading } = useProjecao()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await salvarCenario(cenario)
    setIsSaving(false)
    alert('Simulação salva com sucesso!')
  }

  // Ações de Diretores
  const addDirector = () => {
    const newDir = {
      id: Math.random().toString(),
      nome: 'Novo Cargo',
      periodos: [{ 
        id: Math.random().toString(), 
        valor: 0, 
        mes_inicio: cenario.mes_referencia,
        ano_inicio: cenario.ano_referencia
      }]
    }
    setCenario({ ...cenario, pro_labores: [...cenario.pro_labores, newDir] })
  }

  const removeDirector = (id: string) => {
    setCenario({ ...cenario, pro_labores: cenario.pro_labores.filter(d => d.id !== id) })
  }

  const updateDirectorName = (id: string, nome: string) => {
    setCenario({
      ...cenario,
      pro_labores: cenario.pro_labores.map(d => d.id === id ? { ...d, nome } : d)
    })
  }

  // Ações de Períodos (Aninhados)
  const addPeriod = (directorId: string) => {
    setCenario({
      ...cenario,
      pro_labores: cenario.pro_labores.map(d => {
        if (d.id !== directorId) return d
        const newPeriod = { 
          id: Math.random().toString(), 
          valor: 0, 
          mes_inicio: cenario.mes_referencia,
          ano_inicio: cenario.ano_referencia
        }
        return { ...d, periodos: [...d.periodos, newPeriod] }
      })
    })
  }

  const removePeriod = (directorId: string, periodId: string) => {
    setCenario({
      ...cenario,
      pro_labores: cenario.pro_labores.map(d => {
        if (d.id !== directorId) return d
        return { ...d, periodos: d.periodos.filter(p => p.id !== periodId) }
      })
    })
  }

  const updatePeriod = (directorId: string, periodId: string, field: string, value: any) => {
    setCenario({
      ...cenario,
      pro_labores: cenario.pro_labores.map(d => {
        if (d.id !== directorId) return d
        return {
          ...d,
          periodos: d.periodos.map(p => p.id === periodId ? { ...p, [field]: value } : p)
        }
      })
    })
  }

  const chartData = {
    labels: ['Receita Total', 'Custos Fixos', 'Folha/Pro-labore', 'Variáveis', 'Resultado'],
    datasets: [
      {
        label: 'Projeção (R$)',
        data: [
          calculos.totalReceita,
          cenario.despesas_fixas,
          calculos.totalFolha,
          cenario.despesas_variaveis,
          calculos.resultado
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.6)',
          'rgba(244, 63, 94, 0.6)',
          'rgba(244, 63, 94, 0.6)',
          'rgba(244, 63, 94, 0.6)',
          calculos.resultado >= 0 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(244, 63, 94, 0.8)'
        ],
        borderRadius: 8,
      }
    ]
  }

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Calculator className="text-[#2d8c6f]" />
            Simulador Estratégico
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic">
            Crie cenários hipotéticos comparando períodos e metas.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/60 p-2 rounded-2xl shadow-sm">
           <div className="flex items-center gap-2 px-3 border-r border-slate-100">
             <Calendar size={14} className="text-[#2d8c6f]" />
             <select 
               value={cenario.mes_referencia} 
               onChange={(e) => setCenario({...cenario, mes_referencia: Number(e.target.value)})}
               className="bg-transparent border-none outline-none text-[11px] font-bold text-gray-700 uppercase tracking-widest cursor-pointer"
             >
               {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
             </select>
           </div>
           <div className="flex items-center gap-2 px-3 border-r border-slate-100">
             <Clock size={14} className="text-[#2d8c6f]" />
             <select 
               value={cenario.ano_referencia} 
               onChange={(e) => setCenario({...cenario, ano_referencia: Number(e.target.value)})}
               className="bg-transparent border-none outline-none text-[11px] font-bold text-gray-700 uppercase tracking-widest cursor-pointer"
             >
               {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
             </select>
           </div>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="px-4 py-2 bg-[#2d8c6f] text-white text-[11px] font-bold rounded-xl hover:bg-[#26735a] transition-all flex items-center gap-2 ml-2"
           >
             <Save size={14} />
             {isSaving ? 'SALVANDO...' : 'SALVAR'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Receita Projetada" value={fmtR(calculos.totalReceita)} icon={<TrendingUp size={20} />} category="success" trendLabel={`Base: ${cenario.num_associados} Assoc.`} />
        <KpiCard title="Total em Folha" value={fmtR(calculos.totalFolha)} icon={<Users size={20} />} category="error" trendLabel={`Em ${MESES[cenario.mes_referencia]}/${cenario.ano_referencia}`} />
        <KpiCard 
          title="Resultado Simulado" 
          value={fmtR(calculos.resultado)} 
          icon={<DollarSign size={20} />} 
          category={calculos.resultado >= 0 ? 'success' : 'error'} 
          trendLabel={`Margem de ${fmtPct(calculos.margem)}`}
        />
        <KpiCard title="Reserva Necessária" value={fmtR(calculos.reservaAlvo)} icon={<PiggyBank size={20} />} category="info" trendLabel={`Cobre ${cenario.reserva_meses_alvo} meses`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Parâmetros Gerais */}
          <div className="chart-card bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-[2px] flex items-center gap-2">
              <Plus className="text-[#2d8c6f] w-4 h-4" />
              Parâmetros Operacionais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Associados</span>
                  <input type="number" value={cenario.num_associados} onChange={(e) => setCenario({...cenario, num_associados: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Mensalidade (R$)</span>
                  <input type="number" value={cenario.valor_mensalidade} onChange={(e) => setCenario({...cenario, valor_mensalidade: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Custos Fixos</span>
                  <input type="number" value={cenario.despesas_fixas} onChange={(e) => setCenario({...cenario, despesas_fixas: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Folha Base</span>
                  <input type="number" value={cenario.folha_pagamento} onChange={(e) => setCenario({...cenario, folha_pagamento: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Média Variáveis</span>
                  <input type="number" value={cenario.despesas_variaveis} onChange={(e) => setCenario({...cenario, despesas_variaveis: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Meses Reserva</span>
                  <select value={cenario.reserva_meses_alvo} onChange={(e) => setCenario({...cenario, reserva_meses_alvo: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 outline-none font-bold text-gray-700 text-sm">
                    {[1, 3, 6, 12].map(n => <option key={n} value={n}>{n} Meses</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Seção de Pró-labores (Cards de Diretores) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-2">
                 <Users className="text-[#2d8c6f] w-4 h-4" />
                 Pró-labores da Diretoria
               </h2>
               <button 
                 onClick={addDirector}
                 className="flex items-center gap-2 px-4 py-2 bg-[#2d8c6f]/10 text-[#2d8c6f] text-[10px] font-bold rounded-xl hover:bg-[#2d8c6f]/20 transition-all uppercase tracking-widest"
               >
                 <UserPlus size={14} />
                 Novo Diretor
               </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {cenario.pro_labores.map(dir => (
                 <div key={dir.id} className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeDirector(dir.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-[#2d8c6f]/10 flex items-center justify-center text-[#2d8c6f]">
                        <Users size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={dir.nome} 
                        onChange={(e) => updateDirectorName(dir.id, e.target.value)}
                        className="bg-transparent border-none outline-none font-bold text-gray-800 text-base placeholder:text-slate-300 w-full"
                        placeholder="Cargo/Diretor"
                      />
                   </div>

                   <div className="space-y-3 mb-6">
                      {dir.periodos.map(period => {
                        const targetSerial = cenario.ano_referencia * 12 + cenario.mes_referencia
                        const periodStart = period.ano_inicio * 12 + period.mes_inicio
                        const periodEnd = period.ano_fim !== undefined ? (period.ano_fim * 12 + (period.mes_fim ?? 11)) : 999999
                        const isActive = targetSerial >= periodStart && targetSerial <= periodEnd

                        return (
                          <div key={period.id} className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${isActive ? 'bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-500/20' : 'bg-slate-50 border-slate-100'}`}>
                             <div className="flex items-center gap-2 border-b border-slate-100/50 pb-2 mb-1">
                               <span className="text-[10px] font-bold text-slate-300">R$</span>
                               <input 
                                 type="number" 
                                 value={period.valor} 
                                 onChange={(e) => updatePeriod(dir.id, period.id, 'valor', Number(e.target.value))}
                                 className="w-full bg-transparent border-none outline-none font-extrabold text-sm text-gray-700"
                               />
                               <button onClick={() => removePeriod(dir.id, period.id)} className="text-slate-200 hover:text-rose-500 transition-colors p-1">
                                 <Trash2 size={12} />
                               </button>
                             </div>
                             <div className="flex flex-wrap items-center gap-2">
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-100">
                                 <span className="text-[8px] font-bold text-slate-300 uppercase">De:</span>
                                 <select value={period.mes_inicio} onChange={(e) => updatePeriod(dir.id, period.id, 'mes_inicio', Number(e.target.value))} className="bg-transparent border-none outline-none text-[9px] font-bold text-slate-500 uppercase">
                                   {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                 </select>
                                 <select value={period.ano_inicio} onChange={(e) => updatePeriod(dir.id, period.id, 'ano_inicio', Number(e.target.value))} className="bg-transparent border-none outline-none text-[9px] font-bold text-slate-500 uppercase">
                                   {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                                 </select>
                               </div>
                               <ChevronRight size={10} className="text-slate-200" />
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-100">
                                 <span className="text-[8px] font-bold text-slate-300 uppercase">A:</span>
                                 <select value={period.mes_fim ?? ''} onChange={(e) => updatePeriod(dir.id, period.id, 'mes_fim', e.target.value === '' ? undefined : Number(e.target.value))} className="bg-transparent border-none outline-none text-[9px] font-bold text-slate-500 uppercase">
                                   <option value="">∞</option>
                                   {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                 </select>
                                 <select value={period.ano_fim ?? ''} onChange={(e) => updatePeriod(dir.id, period.id, 'ano_fim', e.target.value === '' ? undefined : Number(e.target.value))} className="bg-transparent border-none outline-none text-[9px] font-bold text-slate-500 uppercase">
                                   <option value="">∞</option>
                                   {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                                 </select>
                               </div>
                             </div>
                          </div>
                        )
                      })}
                   </div>

                   <button 
                     onClick={() => addPeriod(dir.id)}
                     className="w-full py-2 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest rounded-xl hover:bg-slate-100 hover:text-[#2d8c6f] transition-all border border-dashed border-slate-200"
                   >
                     + Adicionar Período
                   </button>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Panel Lateral Visual */}
        <div className="lg:col-span-3 space-y-6">
          <ChartCard 
            title="Distribuição Projetada" 
            subtitle={`Referência: ${MESES[cenario.mes_referencia]} / ${cenario.ano_referencia}`}
          >
            <div className="h-[400px] mt-6">
              <Bar 
                data={chartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                  },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
            <div className="mt-8 space-y-4">
               <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pró-labore no Mês</span>
                  <span className="text-sm font-black text-[#2d8c6f]">{fmtR(calculos.totalProLabores)}</span>
               </div>
               <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margem Líquida Estimada</span>
                  <span className={`text-sm font-black ${calculos.resultado >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fmtPct(calculos.margem)}
                  </span>
               </div>
            </div>
          </ChartCard>

          <div className={`p-8 rounded-[40px] border transition-all duration-500 scale-100 hover:scale-[1.02] ${
            calculos.resultado >= 0 
              ? 'bg-gradient-to-br from-[#1a1c1e] to-[#2d3035] border-white/5 shadow-2xl' 
              : 'bg-gradient-to-br from-rose-600 to-rose-800 border-rose-500 shadow-2xl'
          }`}>
            <h3 className="text-white font-bold text-lg mb-2">Resumo Panorâmico</h3>
            <p className="text-white/40 text-[11px] leading-relaxed mb-8">
              Simulação baseada no comportamento operacional e na folha de pagamentos ativa para o período de referência.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider">Folha vs Receita</span>
                <span className="text-white font-bold text-sm">
                  {fmtPct((calculos.totalFolha / calculos.totalReceita) * 100)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider">Ponto de Equilíbrio</span>
                <span className="text-white font-bold text-sm">
                   ~ {Math.ceil(calculos.totalDespesas / cenario.valor_mensalidade)} Associados
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider">Superávit Mensal</span>
                <span className={`text-lg font-black ${calculos.resultado >= 0 ? 'text-[#34d399]' : 'text-rose-400'}`}>
                   {fmtR(calculos.resultado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
