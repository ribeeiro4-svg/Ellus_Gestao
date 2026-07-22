'use client'
import React, { useState } from 'react'
import { X, User, ShieldCheck, Mail, Phone, Calendar, Trash2, ArrowRightLeft, Plus } from 'lucide-react'
import { Diretor } from '@/lib/hooks/useDiretoria'
import { fmtR } from '@/lib/utils/formatters'

interface ProLaborePeriodo {
  valor: number
  mes_inicio: number
  ano_inicio: number
  mes_fim?: number
  ano_fim?: number
}

interface FichaDiretorModalProps {
  diretor: Diretor
  onClose: () => void
  onSave: (id: string, payload: any) => Promise<{ error: any } | undefined>
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function FichaDiretorModal({ diretor, onClose, onSave }: FichaDiretorModalProps) {
  const [saving, setSaving] = useState(false)
  
  // Clonar períodos para estado local, garantindo que não seja null
  const [periodos, setPeriodos] = useState<ProLaborePeriodo[]>((diretor.periodos || []).map(p => ({...p})))
  const [proLaboreBase, setProLaboreBase] = useState(diretor.pro_labore_base || 0)

  // Order periods chronologically to calculate differences
  const sortedPeriodos = [...periodos].sort((a, b) => {
    if (a.ano_inicio !== b.ano_inicio) return a.ano_inicio - b.ano_inicio
    return a.mes_inicio - b.mes_inicio
  })

  const isentoInss = diretor.cargo?.includes('[ISENTO INSS]') || false
  const cargoClean = diretor.cargo?.replace(' [ISENTO INSS]', '')?.replace('[ISENTO INSS]', '')?.trim() || 'Membro'

  const handleSave = async () => {
    setSaving(true)
    
    // Auto-atualizar o pro_labore_base se houver períodos (usar o valor do último período vigente)
    let finalBase = proLaboreBase
    if (periodos.length > 0) {
      // O último período cronologicamente
      const ultimo = sortedPeriodos[sortedPeriodos.length - 1]
      finalBase = ultimo.valor
    }

    const payload = {
      periodos,
      pro_labore_base: finalBase
    }

    await onSave(diretor.id, payload)
    setSaving(false)
    onClose()
  }

  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-white text-xl">
              {diretor.nome.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Ficha do Diretor</h2>
              <p className="text-xs text-indigo-200 font-medium">{diretor.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col md:flex-row">
          
          {/* Coluna Esquerda: Dados Cadastrais */}
          <div className="w-full md:w-1/3 bg-white p-6 md:p-8 border-r border-slate-100 flex flex-col gap-6">
            <div>
              <label className={labelCls}>Nome Completo</label>
              <div className="text-sm font-bold text-slate-800">{diretor.nome}</div>
            </div>
            <div>
              <label className={labelCls}>Cargo</label>
              <div className="text-sm font-bold text-slate-800">{cargoClean}</div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  diretor.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>{diretor.status}</span>
                {isentoInss && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Isento INSS</span>}
              </div>
            </div>
            {diretor.cpf && (
              <div>
                <label className={labelCls}>CPF</label>
                <div className="text-sm font-bold text-slate-600">{diretor.cpf}</div>
              </div>
            )}
            {(diretor.email || diretor.telefone) && (
              <div className="flex flex-col gap-3">
                <label className={labelCls}>Contato</label>
                {diretor.telefone && <div className="text-sm font-semibold text-slate-600 flex items-center gap-2"><Phone size={14}/> {diretor.telefone}</div>}
                {diretor.email && <div className="text-sm font-semibold text-slate-600 flex items-center gap-2 break-all"><Mail size={14}/> {diretor.email}</div>}
              </div>
            )}
            {diretor.banco_info && (
              <div>
                <label className={labelCls}>Dados Bancários</label>
                <div className="text-xs font-semibold text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {diretor.banco_info}
                </div>
              </div>
            )}
            {diretor.chave_pix && (
              <div>
                <label className={labelCls}>Chave PIX</label>
                <div className="text-sm font-bold text-emerald-600 break-all">{diretor.chave_pix}</div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Histórico de Pró-labore */}
          <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" size={18}/> Evolução do Pró-labore
              </h3>
              <button 
                onClick={() => {
                  setPeriodos([...periodos, { valor: 0, mes_inicio: new Date().getMonth(), ano_inicio: new Date().getFullYear() }])
                }}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <Plus size={14}/> Adicionar Reajuste
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {periodos.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
                  <p className="text-sm font-medium text-slate-400">Nenhum período de pró-labore cadastrado.</p>
                </div>
              ) : (
                sortedPeriodos.map((p, idx) => {
                  // Calcular diferença em relação ao anterior
                  let diff = 0
                  let pct = 0
                  if (idx > 0) {
                    const prev = sortedPeriodos[idx - 1]
                    diff = p.valor - prev.valor
                    if (prev.valor > 0) {
                      pct = (diff / prev.valor) * 100
                    }
                  }

                  // Localizar índice no array original para poder deletar/editar
                  const originalIdx = periodos.findIndex(op => op === p)

                  return (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 relative animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <label className={labelCls}>Valor Base (R$)</label>
                          <input 
                            type="number" 
                            value={p.valor || ''} 
                            onChange={e => {
                              const newP = [...periodos]
                              newP[originalIdx].valor = Number(e.target.value)
                              setPeriodos(newP)
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-indigo-700 outline-none focus:border-indigo-500 w-32"
                          />
                        </div>

                        {idx > 0 && diff !== 0 && (
                          <div className={`mt-5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                            diff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {diff > 0 ? 'Aumento' : 'Redução'}: {diff > 0 ? '+' : ''}{fmtR(diff)} ({diff > 0 ? '+' : ''}{pct.toFixed(2)}%)
                          </div>
                        )}

                        <button 
                          onClick={() => setPeriodos(periodos.filter((_, i) => i !== originalIdx))} 
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors absolute top-4 right-4"
                          title="Remover Período"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex-1 flex flex-col gap-2">
                          <label className={labelCls}><Calendar size={10} className="inline mr-1" />Início (Vigência)</label>
                          <div className="flex gap-2">
                            <select 
                              value={p.mes_inicio} 
                              onChange={e => { const newP = [...periodos]; newP[originalIdx].mes_inicio = Number(e.target.value); setPeriodos(newP) }} 
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none"
                            >
                              {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <select 
                              value={p.ano_inicio} 
                              onChange={e => { const newP = [...periodos]; newP[originalIdx].ano_inicio = Number(e.target.value); setPeriodos(newP) }} 
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none"
                            >
                              {[2024,2025,2026,2027,2028,2029].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                        </div>
                        <ArrowRightLeft size={16} className="text-slate-300 mt-5" />
                        <div className="flex-1 flex flex-col gap-2">
                          <label className={labelCls}><Calendar size={10} className="inline mr-1" />Fim (Opcional)</label>
                          <div className="flex gap-2">
                            <select 
                              value={p.mes_fim ?? ''} 
                              onChange={e => { const newP = [...periodos]; newP[originalIdx].mes_fim = e.target.value === '' ? undefined : Number(e.target.value); setPeriodos(newP) }} 
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none"
                            >
                              <option value="">Atual</option>
                              {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <select 
                              value={p.ano_fim ?? ''} 
                              onChange={e => { const newP = [...periodos]; newP[originalIdx].ano_fim = e.target.value === '' ? undefined : Number(e.target.value); setPeriodos(newP) }} 
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none"
                            >
                              <option value="">Atual</option>
                              {[2024,2025,2026,2027,2028,2029].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-slate-500 text-xs font-black uppercase tracking-wide hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-indigo-200"
            style={{ background: 'linear-gradient(135deg, #312e81, #4338ca)' }}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </div>
    </div>
  )
}
