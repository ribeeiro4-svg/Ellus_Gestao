'use client'
import React, { useState, useEffect } from 'react'
import { Lock, Unlock, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { getPeriodosAction, fecharPeriodoAction, reabrirPeriodoAction } from '../actions/periodoActions'

export default function FechamentoPeriodos() {
  const [periodos, setPeriodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await getPeriodosAction()
    setPeriodos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleFechar = async (mes: number, ano: number) => {
    const competencia = `${ano}-${mes.toString().padStart(2, '0')}-01`
    if (!confirm(`Deseja FECHAR o período contábil de ${mes}/${ano}?\n\nIsso impedirá novos lançamentos, edições ou integrações neste período.`)) return

    setProcessando(competencia)
    const res = await fecharPeriodoAction(competencia)
    setProcessando(null)

    if (res.error) alert(res.error)
    else load()
  }

  const handleReabrir = async (id: string) => {
    if (!confirm('Deseja REABRIR este período? Lançamentos poderão ser feitos novamente.')) return

    setProcessando(id)
    const res = await reabrirPeriodoAction(id)
    setProcessando(null)

    if (res.error) alert(res.error)
    else load()
  }

  // Gerar lista de meses do ano atual e anterior para fechar
  const anoAtual = new Date().getFullYear()
  const mesesDisponiveis = []
  for (let a = anoAtual; a >= anoAtual - 1; a--) {
    for (let m = 12; m >= 1; m--) {
      const competencia = `${a}-${m.toString().padStart(2, '0')}-01`
      const jaExiste = periodos.find(p => p.competencia === competencia)
      if (!jaExiste) {
        mesesDisponiveis.push({ mes: m, ano: a, competencia })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Gestão de Períodos Contábeis</h3>
            <p className="text-xs text-slate-500 font-medium italic">O fechamento do período garante a integridade dos saldos para as demonstrações.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Períodos Abertos (Novos para Fechar) */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Disponíveis para Fechamento
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {mesesDisponiveis.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                  <div>
                    <p className="text-sm font-black text-slate-700">{item.mes.toString().padStart(2, '0')}/{item.ano}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Status: Aberto</p>
                  </div>
                  <button
                    onClick={() => handleFechar(item.mes, item.ano)}
                    disabled={processando === item.competencia}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm flex items-center gap-2"
                  >
                    {processando === item.competencia ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                    FECHAR MÊS
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Períodos Fechados */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500" /> Períodos Encerrados
            </h4>
            <div className="space-y-2">
              {periodos.filter(p => p.status === 'fechado').length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">Nenhum período encerrado.</p>
                </div>
              ) : (
                periodos.filter(p => p.status === 'fechado').map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div>
                      <p className="text-sm font-black text-emerald-800">
                        {new Date(p.competencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] text-emerald-600 font-medium">
                        Encerrado em {new Date(p.data_fechamento).toLocaleDateString('pt-BR')} por {p.usuario_fechou}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReabrir(p.id)}
                      disabled={processando === p.id}
                      className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                    >
                      {processando === p.id ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                      REABRIR
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <AlertCircle className="text-indigo-600 flex-shrink-0" size={18} />
          <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
            <strong>Importante:</strong> Ao fechar um período, o sistema trava todas as operações contábeis retroativas. 
            Isso é essencial antes de emitir o Balanço Patrimonial definitivo ou gerar o arquivo ECD para a Receita Federal.
          </p>
        </div>
      </div>
    </div>
  )
}
