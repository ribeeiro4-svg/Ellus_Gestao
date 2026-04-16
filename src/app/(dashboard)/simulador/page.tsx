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
  UserPlus
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

export default function SimuladorPage() {
  const { cenario, setCenario, salvarCenario, calculos, loading } = useProjecao()
  const [isSaving, setIsSaving] = useState(false)

  const handleAddProLabore = () => {
    const newItem = { 
      id: Math.random().toString(), 
      nome: 'Novo Diretor', 
      valor: 0, 
      mes_inicio: undefined, 
      mes_fim: undefined 
    }
    setCenario({ ...cenario, pro_labores: [...cenario.pro_labores, newItem] })
  }

  const handleRemoveProLabore = (id: string) => {
    setCenario({ ...cenario, pro_labores: cenario.pro_labores.filter(p => p.id !== id) })
  }

  const handleProLaboreChange = (id: string, field: 'nome' | 'valor' | 'mes_inicio' | 'mes_fim', value: string | number | undefined) => {
    setCenario({
      ...cenario,
      pro_labores: cenario.pro_labores.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    await salvarCenario(cenario)
    setIsSaving(false)
    alert('Cenário salvo com sucesso!')
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
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Calculator className="text-[#2d8c6f]" />
            Simulador de Projeções
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic">
            Crie cenários hipotéticos para planejar o futuro da associação.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar Cenário'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Receita Projetada" value={fmtR(calculos.totalReceita)} icon={<TrendingUp size={20} />} category="success" trendLabel="Recorrente Mensal" />
        <KpiCard title="Despesa Projetada" value={fmtR(calculos.totalDespesas)} icon={<TrendingDown size={20} />} category="error" trendLabel="Total de Saídas" />
        <KpiCard 
          title="Resultado Simulado" 
          value={fmtR(calculos.resultado)} 
          icon={<DollarSign size={20} />} 
          category={calculos.resultado >= 0 ? 'success' : 'error'} 
          trendLabel={`Margem de ${fmtPct(calculos.margem)}`}
        />
        <KpiCard title="Reserva de 3 Meses" value={fmtR(calculos.reservaAlvo)} icon={<PiggyBank size={20} />} category="info" trendLabel="Meta de Segurança" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Controles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="chart-card bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Plus className="text-[#2d8c6f] w-5 h-5" />
              Parâmetros da Simulação
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Número de Associados</span>
                  <input 
                    type="number" 
                    value={cenario.num_associados}
                    onChange={(e) => setCenario({...cenario, num_associados: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Valor da Mensalidade (R$)</span>
                  <input 
                    type="number" 
                    value={cenario.valor_mensalidade}
                    onChange={(e) => setCenario({...cenario, valor_mensalidade: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Folha Base (Outros Funcionários)</span>
                  <input 
                    type="number" 
                    value={cenario.folha_pagamento}
                    onChange={(e) => setCenario({...cenario, folha_pagamento: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Custos Fixos Mensais</span>
                  <input 
                    type="number" 
                    value={cenario.despesas_fixas}
                    onChange={(e) => setCenario({...cenario, despesas_fixas: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Média de Despesas Variáveis</span>
                  <input 
                    type="number" 
                    value={cenario.despesas_variaveis}
                    onChange={(e) => setCenario({...cenario, despesas_variaveis: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Meses de Reserva Alvo</span>
                  <select 
                    value={cenario.reserva_meses_alvo}
                    onChange={(e) => setCenario({...cenario, reserva_meses_alvo: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-[#2d8c6f]/20 outline-none font-bold text-gray-700 transition-all"
                  >
                    {[1, 2, 3, 6, 12].map(n => <option key={n} value={n}>{n} Meses</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="chart-card bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-[#2d8c6f] w-5 h-5" />
                Pró-labores da Diretoria
              </h2>
              <button 
                onClick={handleAddProLabore}
                className="flex items-center gap-2 px-4 py-2 bg-[#2d8c6f]/10 text-[#2d8c6f] text-[11px] font-bold rounded-xl hover:bg-[#2d8c6f]/20 transition-all uppercase tracking-widest"
              >
                <UserPlus size={14} />
                Adicionar Sócio/Diretor
              </button>
            </div>

            <div className="space-y-3">
              {cenario.pro_labores.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  Nenhum pró-labore cadastrado.
                </div>
              ) : (
                cenario.pro_labores.map((p) => (
                  <div key={p.id} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100 group">
                    <div className="flex-1 flex gap-3 items-center min-w-[200px] w-full">
                      <input 
                        type="text" 
                        value={p.nome}
                        placeholder="Cargo / Nome"
                        onChange={(e) => handleProLaboreChange(p.id, 'nome', e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 text-sm"
                      />
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400">R$</span>
                        <input 
                          type="number" 
                          value={p.valor}
                          onChange={(e) => handleProLaboreChange(p.id, 'valor', Number(e.target.value))}
                          className="w-24 bg-transparent border-none outline-none font-bold text-gray-700 text-sm text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">De</span>
                        <select 
                          value={p.mes_inicio ?? ''}
                          onChange={(e) => handleProLaboreChange(p.id, 'mes_inicio', e.target.value === '' ? undefined : Number(e.target.value))}
                          className="bg-white border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-600 outline-none"
                        >
                          <option value="">-</option>
                          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">A</span>
                        <select 
                          value={p.mes_fim ?? ''}
                          onChange={(e) => handleProLaboreChange(p.id, 'mes_fim', e.target.value === '' ? undefined : Number(e.target.value))}
                          className="bg-white border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-600 outline-none"
                        >
                          <option value="">A partir</option>
                          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                      </div>
                      <button 
                        onClick={() => handleRemoveProLabore(p.id)}
                        className="text-slate-300 hover:text-rose-500 p-2 transition-colors md:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cenario.pro_labores.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center px-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pró-labore</span>
                <span className="text-lg font-black text-[#2d8c6f]">{fmtR(calculos.totalProLabores)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Painel Lateral Visual */}
        <div className="space-y-6">
          <ChartCard 
            title="Distribuição Mensal" 
            subtitle="Cenário Simulado"
          >
            <div className="h-[300px] mt-6">
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
          </ChartCard>

          <div className={`p-8 rounded-3xl border transition-all duration-500 scale-100 hover:scale-[1.02] ${
            calculos.resultado >= 0 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 shadow-xl shadow-emerald-500/20' 
              : 'bg-gradient-to-br from-rose-500 to-rose-700 border-rose-400 shadow-xl shadow-rose-500/20'
          }`}>
            <h3 className="text-white font-bold text-lg mb-2">Diagnóstico de Saúde</h3>
            <p className="text-white/80 text-xs leading-relaxed mb-6 font-medium">
              {calculos.resultado >= 0 
                ? 'Este cenário apresenta um SUPERÁVIT sustentável. A associação tem capacidade de investimento e formação de reserva.' 
                : 'Este cenário resultará em DÉFICIT mensal. Recomenda-se reduzir custos fixos ou aumentar a mensalidade dos associados.'}
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 text-[10px] font-bold uppercase">Folha / Receita</span>
                <span className="text-white font-bold text-sm">
                  {fmtPct((calculos.totalFolha / calculos.totalReceita) * 100)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/60 text-[10px] font-bold uppercase">Breakeven</span>
                <span className="text-white font-bold text-sm">
                  {Math.ceil(calculos.totalDespesas / cenario.valor_mensalidade)} Assoc.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
