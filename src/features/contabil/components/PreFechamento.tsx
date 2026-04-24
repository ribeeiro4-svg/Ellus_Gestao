'use client'
import React, { useState } from 'react'
import { ClipboardCheck, Play, DollarSign, Calculator, AlertCircle, Loader2 } from 'lucide-react'
import { processarProvisoesMensaisAction } from '../actions/provisoesActions'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function PreFechamento() {
  const [loading, setLoading] = useState(false)
  const [baseSalarial, setBaseSalarial] = useState(10000)
  const [resultado, setResultado] = useState<any>(null)
  
  const hoje = new Date()
  const mesAnterior = hoje.getMonth() === 0 ? 12 : hoje.getMonth()
  const anoAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()
  const competencia = `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}-01`

  const handleProcessar = async () => {
    if (!confirm(`Deseja gerar os lançamentos de provisão de Férias e 13º para o período ${mesAnterior}/${anoAnterior}?`)) return
    
    setLoading(true)
    const res = await processarProvisoesMensaisAction(competencia, baseSalarial)
    setLoading(false)

    if (res.error) alert(res.error)
    else {
      setResultado(res)
      alert(`Lançamentos de provisão gerados com sucesso!\nValor total provisionado: ${fmtR(res.valor || 0)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Rotina de Pré-fechamento Mensal</h3>
            <p className="text-xs text-slate-500 font-medium">Ajustes e provisões antes do encerramento definitivo do período.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuração de Provisões */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={16} className="text-indigo-600" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Provisões Trabalhistas (Férias/13º)</h4>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Base Salarial do Mês (Somatório Folha)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input 
                    type="number"
                    value={baseSalarial}
                    onChange={e => setBaseSalarial(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <p className="text-[9px] text-slate-400 italic">O sistema calculará 1/12 avos de 13º e Férias (+ 1/3) sobre esta base.</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Provisão 13º (8,33%)</span>
                  <span>{fmtR(baseSalarial / 12)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Provisão Férias + 1/3</span>
                  <span>{fmtR((baseSalarial / 12) * 1.3333)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 border-t pt-2">
                  <span>Encargos Sociais (Est. 28%)</span>
                  <span>{fmtR((baseSalarial / 12 * 1 + baseSalarial / 12 * 1.3333) * 0.28)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-indigo-600 border-t pt-2">
                  <span>Total Provisionado</span>
                  <span>{fmtR((baseSalarial / 12 * 1 + baseSalarial / 12 * 1.3333) * 1.28)}</span>
                </div>
              </div>

              <button
                onClick={handleProcessar}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Processar Provisões de {mesAnterior.toString().padStart(2, '0')}/{anoAnterior}
              </button>
            </div>
          </div>

          {/* Checklist de Conferência */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={12} className="text-indigo-500" /> Checklist de Conferência
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Conciliação Bancária finalizada', checked: true },
                { label: 'Categorias financeiras mapeadas', checked: true },
                { label: 'Depreciação mensal processada', checked: false },
                { label: 'Verificar saldos negativos', checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                <strong>Dica:</strong> Após concluir o pré-fechamento e as provisões, vá até a aba "Períodos" e feche o mês para garantir que nenhum dado seja alterado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
