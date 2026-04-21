'use client'
import React, { useState } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  PiggyBank, 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  UserPlus,
  Calendar,
  ChevronRight,
  Clock,
  RefreshCw,
  LayoutGrid,
  CalendarDays,
  Copy
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import { useProjecao } from '@/lib/hooks/useProjecao'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { fmtR, fmtPct, MESES } from '@/lib/utils/formatters'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, BarController
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, BarController)

const ANOS = [2024, 2025, 2026, 2027, 2028]

export default function SimuladorTab() {
  const { cenario, setCenario, visao, setVisao, salvarCenario, limparTudo, carregarDadosReais, loading, syncing, calculos, projecaoAnual } = useProjecao()
  const { diretoria } = useDiretoria()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const res = await salvarCenario(cenario)
    setIsSaving(false)
    if (res.error) {
      alert(`Erro ao salvar simulação: ${(res.error as any).message || res.error}`)
    } else {
      alert('Simulação salva com sucesso!')
    }
  }

  const handleReset = async () => {
    if (confirm('Deseja apagar todas as configurações e rascunhos desta simulação?')) {
      await limparTudo()
      window.location.reload()
    }
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

  const applyDirectorTemplate = (id: string, boardMemberId: string) => {
    const member = diretoria.find(m => m.id === boardMemberId)
    if (!member) return
    
    setCenario({
      ...cenario,
      pro_labores: cenario.pro_labores.map(d => d.id === id ? { 
        ...d, 
        nome: `${member.nome} (${member.cargo})`,
        periodos: d.periodos.map((p: any, idx: number) => idx === 0 ? { ...p, valor: member.pro_labore_base || 0 } : p)
      } : d)
    })
  }

  const duplicateDirector = (director: any) => {
    const newDir = {
      ...director,
      id: Math.random().toString(),
      nome: `${director.nome} (Cópia)`,
      periodos: director.periodos.map((p: any) => ({
        ...p,
        id: Math.random().toString()
      }))
    }
    setCenario({ ...cenario, pro_labores: [...cenario.pro_labores, newDir] })
  }

  // Ações de Períodos
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

  const chartDataSnapshot = {
    labels: ['Receita', 'Fixas', 'Variáveis', 'Folha', 'Resultado'],
    datasets: [
      {
        label: visao === 'mensal' ? 'Valor Mensal' : 'Acumulado Anual',
        data: [
          calculos.totalReceita,
          calculos.totalFixas,
          calculos.totalVariaveis,
          calculos.totalFolha,
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

  const chartDataEvolution = {
    labels: MESES,
    datasets: [
      {
        label: 'Resultado (R$)',
        data: projecaoAnual.map(p => p.resultado),
        borderColor: '#2d8c6f',
        backgroundColor: 'rgba(45, 140, 111, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#2d8c6f'
      }
    ]
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Sub-header de controles do Simulador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 p-4 rounded-3xl border border-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#2d8c6f]">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Simulador Estratégico</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controles de Projeção</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Seletor Visão */}
           <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2">
              <button 
                onClick={() => setVisao('mensal')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${visao === 'mensal' ? 'bg-white text-[#2d8c6f] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={12} />
                MENSAL
              </button>
              <button 
                onClick={() => setVisao('anual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${visao === 'anual' ? 'bg-white text-[#2d8c6f] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CalendarDays size={12} />
                ANUAL
              </button>
           </div>

           <div className={`flex items-center gap-2 px-3 border-r border-slate-100 ${visao === 'anual' ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}>
             <Calendar size={14} className="text-[#2d8c6f]" />
             <select 
               disabled={visao === 'anual'}
               value={cenario.mes_referencia} 
               onChange={(e) => setCenario({...cenario, mes_referencia: Number(e.target.value)})}
               className="bg-transparent border-none outline-none text-[11px] font-bold text-gray-700 uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
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

           <button 
             onClick={handleReset}
             className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2"
             title="Resetar Simulação"
           >
             <Trash2 size={16} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title={`Receita ${visao === 'mensal' ? 'Mensal' : 'Anual'}`} 
          value={fmtR(calculos.totalReceita)} 
          icon={<TrendingUp size={20} />} 
          category="success" 
          trendLabel={`Base: ${cenario.num_associados} Assoc.`} 
          explanation={{
            description: "Projeção baseada na quantidade de associados multiplicada pelo valor da mensalidade.",
            formula: "Associados × Mensalidade (+/- Meses do Período)",
            example: "100 associados a R$ 50,00 = Projeção de R$ 5k/mês."
          }}
        />
        <KpiCard 
          title={`Total Folha (${visao === 'mensal' ? 'Mês' : 'Ano'})`} 
          value={fmtR(calculos.totalFolha)} 
          icon={<Users size={20} />} 
          category="error" 
          trendLabel={visao === 'mensal' ? `Ref: ${MESES[cenario.mes_referencia]}` : 'Acumulado 12 meses'} 
          explanation={{
            description: "Soma da Folha Base organizacional mais os Pró-labores individuais configurados.",
            formula: "Folha Base + Σ(Pró-labores)",
            example: "R$ 10k de CLT + R$ 2k de Diretoria = R$ 12k de Folha."
          }}
        />
        <KpiCard 
          title={`Resultado ${visao === 'mensal' ? 'Líquido' : 'Anual'}`} 
          value={fmtR(calculos.resultado)} 
          icon={<DollarSign size={20} />} 
          category={calculos.resultado >= 0 ? 'success' : 'error'} 
          trendLabel={`Margem de ${fmtPct(calculos.margem)}`}
          explanation={{
            description: "O que sobra livre para a reserva após pagar custos fixos, variáveis e folha de pagamento.",
            formula: "Receita - (Fixas + Variáveis + Folha)",
            example: "Visão consolidada para verificar se o cenário é sustentável a longo prazo."
          }}
        />
        <KpiCard 
          title="Meta de Reserva" 
          value={fmtR(calculos.reservaAlvo)} 
          icon={<PiggyBank size={20} />} 
          category="info" 
          trendLabel={visao === 'mensal' ? `Cobre ${cenario.reserva_meses_alvo} meses` : 'Base anual'} 
          explanation={{
            description: "Valor alvo de caixa acumulado para manter a associação operante sem novas receitas.",
            formula: "Média de Despesas Mensais × Meses Alvo",
            example: "Se gasta R$ 5k e quer 6 meses de segurança, a meta é de R$ 30k."
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Parâmetros Gerais */}
          <div className="chart-card bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-2">
                <Plus className="text-[#2d8c6f] w-4 h-4" />
                Base da Operação
              </h2>
              <button 
                onClick={carregarDadosReais}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-lg hover:bg-slate-200 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sincronizando...' : 'Carregar Realidade'}
              </button>
            </div>
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Custos Fixos /mês</span>
                  <input type="number" value={cenario.despesas_fixas} onChange={(e) => setCenario({...cenario, despesas_fixas: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Folha Base /mês</span>
                  <input type="number" value={cenario.folha_pagamento} onChange={(e) => setCenario({...cenario, folha_pagamento: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all text-sm"/>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Reserva de Emergência (meses)</span>
                  <input type="number" value={cenario.reserva_meses_alvo} onChange={(e) => setCenario({...cenario, reserva_meses_alvo: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-indigo-50/50 border border-indigo-100 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-indigo-600 transition-all text-sm"/>
                </label>
              </div>
            </div>
          </div>

          {/* Pró-labores */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-2">
                 <Users className="text-[#2d8c6f] w-4 h-4" />
                 Pró-labores da Diretoria
               </h2>
               <button onClick={addDirector} className="px-5 py-2.5 bg-[#2d8c6f] text-white text-[10px] font-black rounded-xl hover:bg-[#20634f] transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/10 flex items-center gap-2">
                 <UserPlus size={14} />
                 + Novo Diretor
               </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {cenario.pro_labores.map(dir => (
                 <div key={dir.id} className="bg-white/80 backdrop-blur-md border border-white/60 rounded-[32px] p-6 shadow-sm group relative">
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button onClick={() => duplicateDirector(dir)} className="text-slate-300 hover:text-[#2d8c6f]" title="Duplicar">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => removeDirector(dir.id)} className="text-slate-300 hover:text-rose-500" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-[#2d8c6f]/10 flex items-center justify-center text-[#2d8c6f]">
                        <Users size={18} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <select 
                          value={diretoria.find(m => `${m.nome} (${m.cargo})` === dir.nome)?.id || ""}
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              updateDirectorName(dir.id, "Cargo Customizado")
                            } else {
                              applyDirectorTemplate(dir.id, e.target.value)
                            }
                          }}
                          className="bg-transparent border-none outline-none font-bold text-gray-800 text-base w-full cursor-pointer appearance-none hover:text-[#2d8c6f] transition-colors"
                        >
                          <option value="" disabled>{dir.nome || "Selecione um Membro..."}</option>
                          {diretoria.map(m => (
                            <option key={m.id} value={m.id}>{m.nome} ({m.cargo})</option>
                          ))}
                          <option value="custom">+ DEFINIR NOME MANUALMENTE</option>
                        </select>
                        {(!diretoria.some(m => `${m.nome} (${m.cargo})` === dir.nome) || dir.nome === "Cargo Customizado") && (
                           <input 
                             type="text" 
                             value={dir.nome} 
                             onChange={(e) => updateDirectorName(dir.id, e.target.value)}
                             className="bg-transparent border-b border-dashed border-slate-200 outline-none font-medium text-gray-500 text-[11px] w-full mt-1 animate-in slide-in-from-top-1 duration-300"
                             placeholder="Digite o nome/cargo personalizado..."
                           />
                        )}
                      </div>
                   </div>

                   <div className="space-y-3 mb-6">
                      {dir.periodos.map(period => {
                        const targetSerial = cenario.ano_referencia * 12 + cenario.mes_referencia
                        const periodStart = period.ano_inicio * 12 + period.mes_inicio
                        const periodEnd = period.ano_fim !== undefined ? (period.ano_fim * 12 + (period.mes_fim ?? 11)) : 999999
                        const isActive = visao === 'mensal' && targetSerial >= periodStart && targetSerial <= periodEnd

                        return (
                          <div key={period.id} className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${isActive ? 'bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-500/20 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                             <div className="flex items-center gap-2 border-b border-slate-100/50 pb-2 mb-1">
                               <span className="text-[10px] font-bold text-slate-300">R$</span>
                               <input 
                                 type="number" 
                                 value={period.valor} 
                                 onChange={(e) => updatePeriod(dir.id, period.id, 'valor', Number(e.target.value))}
                                 className="w-full bg-transparent border-none outline-none font-extrabold text-sm text-gray-700"
                               />
                               <button onClick={() => removePeriod(dir.id, period.id)} className="text-slate-200 hover:text-rose-500 p-1">
                                 <Trash2 size={12} />
                               </button>
                             </div>
                             <div className="flex flex-wrap items-center gap-2">
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-100">
                                 <select value={period.mes_inicio} onChange={(e) => updatePeriod(dir.id, period.id, 'mes_inicio', Number(e.target.value))} className="bg-transparent border-none outline-none text-[9px] font-bold text-slate-500 uppercase">
                                   {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                 </select>
                                 <select value={period.ano_inicio} onChange={(e) => updatePeriod(dir.id, period.id, 'ano_inicio', Number(e.target.value))} className="bg-transparent border-none outline-none text-[9px] font-bold text-slate-500 uppercase">
                                   {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                                 </select>
                               </div>
                               <ChevronRight size={10} className="text-slate-200" />
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-100">
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
                     className="w-full py-2 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest rounded-xl hover:bg-slate-100 border border-dashed border-slate-200"
                   >
                     + Período
                   </button>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Dashboards */}
        <div className="lg:col-span-3 space-y-8">
          <ChartCard 
            title={`Composição ${visao === 'mensal' ? 'do Mês' : 'do Ano'}`} 
            subtitle={visao === 'mensal' ? `${MESES[cenario.mes_referencia]} / ${cenario.ano_referencia}` : `Consolidado ${cenario.ano_referencia}`}
          >
            <div className="h-[350px] mt-6">
              <Bar 
                data={chartDataSnapshot} 
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
            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Pró-labore</span>
                  <span className="text-sm font-black text-[#2d8c6f]">{fmtR(calculos.totalProLabores)}</span>
               </div>
               <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Margem Projetada</span>
                  <span className={`text-sm font-black ${calculos.resultado >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fmtPct(calculos.margem)}
                  </span>
               </div>
            </div>
          </ChartCard>

          <ChartCard 
            title="Evolução Mensal (Projeção)" 
            subtitle="Resultados de Janeiro a Dezembro"
          >
            <div className="h-[300px] mt-6">
              <Line 
                data={chartDataEvolution} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                  },
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `Resultado: ${fmtR(ctx.parsed.y || 0)}`
                      }
                    }
                  }
                }} 
              />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
