import React, { useState } from 'react'
import { X, Calendar, DollarSign, Tag, Info, CheckCircle2, CreditCard, User, Building2, TrendingUp, ArrowUpRight, ArrowDownLeft, MoveRight, HelpCircle, Check } from 'lucide-react'
import { Lancamento, Associado } from '@/lib/types'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface LaunchDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  launch: Lancamento | null
  associados?: Associado[]
  onRemanejar?: (idOriginal: string, targetId: string, valor: number, descricao: string) => Promise<{ error: string | null }>
  linkedName?: string
  linkedType?: 'associado' | 'fornecedor' | 'diretor'
}

export default function LaunchDetailsModal({ isOpen, onClose, launch, associados = [], onRemanejar, linkedName, linkedType }: LaunchDetailsModalProps) {
  const [isRemanejando, setIsRemanejando] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [valorMover, setValorMover] = useState<number>(0)
  const [novaDesc, setNovaDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !launch) return null

  const matchTaxa = (launch.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
  const valorTaxaNum = matchTaxa ? parseFloat(matchTaxa[1].replace('.', '').replace(',', '.')) : 0
  const valorPrincipal = launch.valor
  const valorBruto = valorPrincipal + valorTaxaNum

  const isReceita = launch.tipo === 'receita'
  
  // Detalhe de quem fez o PIX de fato (se for um encontro de contas)
  const pagadorOriginal = (launch as any).descricao_detalhada || null

  const handleStartRemanejo = () => {
    setIsRemanejando(true)
    setValorMover(valorTaxaNum > 0 ? valorTaxaNum : Math.floor(valorPrincipal / 2))
    setNovaDesc(launch.descricao.replace(matchTaxa?.[0] || '', '').trim())
  }

  const execRemanejo = async () => {
    if (!targetId || !valorMover || !onRemanejar) return
    setIsSubmitting(true)
    try {
      await onRemanejar(launch.id, targetId, valorMover, novaDesc)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className={`relative h-32 bg-gradient-to-br ${isRemanejando ? 'from-indigo-600 via-indigo-700 to-indigo-900' : 'from-[#10b981] via-[#059669] to-[#047857]'} p-8 flex items-center transition-colors duration-500`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
              {isRemanejando ? <MoveRight className="text-white" size={28} /> : isReceita ? <ArrowUpRight className="text-white" size={28} /> : <ArrowDownLeft className="text-white" size={28} />}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold font-outfit leading-tight">
                {isRemanejando ? 'Remanejar Valor' : 'Detalhes do Lançamento'}
              </h2>
              <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/10 w-fit">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {isRemanejando ? 'Encontro de Contas' : launch.tipo}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 pb-10">
          {!isRemanejando ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Final</span>
                <div className={`text-4xl font-black ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtR(valorPrincipal)}
                </div>
                
                {isReceita && valorTaxaNum > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200/60 w-full flex flex-col gap-2">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-semibold text-gray-500">Valor Bruto:</span>
                      <span className="text-sm font-bold text-gray-700">{fmtR(valorBruto)}</span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-semibold text-amber-500">(-) Disponível para Remanejo:</span>
                      <span className="text-sm font-bold text-amber-600">{fmtR(valorTaxaNum)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Calendar size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Data</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{fmtData(launch.data)}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Tag size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Categoria</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{launch.categoria || 'Sem categoria'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Descrição</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed italic">
                    {launch.descricao?.replace(matchTaxa?.[0] || '', '').trim()}
                  </p>
                </div>

                {pagadorOriginal && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg"><HelpCircle size={16} /></div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400">Pagamento efetuado por</span>
                      <p className="text-xs font-bold text-indigo-900">{pagadorOriginal}</p>
                    </div>
                  </div>
                )}

                {(launch.associado_id || linkedName) && (
                  <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase">
                        {linkedName?.charAt(0) || 'A'}
                      </div>
                      <span className="text-sm font-bold text-emerald-800">{linkedName || 'Identificado'}</span>
                    </div>
                    {isReceita && !launch.descricao.includes('[ENCONTRO') && (
                      <button 
                        onClick={handleStartRemanejo}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        <MoveRight size={14} /> REMANEJAR
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-center">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Valor a ser Reatribuído</span>
                <div className="text-3xl font-black text-indigo-700">{fmtR(valorMover)}</div>
                <input 
                  type="range" 
                  min={1} 
                  max={valorBruto - 1} 
                  value={valorMover} 
                  onChange={(e) => setValorMover(Number(e.target.value))}
                  className="w-full mt-4 accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Selecionar Beneficiário (Associado)</label>
                  <select 
                    value={targetId} 
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-indigo-200 text-sm font-bold transition-all"
                  >
                    <option value="">Selecione...</option>
                    {associados.filter(a => a.id !== launch.associado_id).map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Descrição do Lançamento</label>
                  <textarea 
                    value={novaDesc}
                    onChange={(e) => setNovaDesc(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 ring-indigo-200 text-sm font-semibold transition-all italic h-20"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={execRemanejo}
                  disabled={!targetId || isSubmitting}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-100"
                >
                  {isSubmitting ? <span className="animate-spin text-lg">◌</span> : <Check size={18} />} CONFIRMAR REMANEJO
                </button>
                <button 
                  onClick={() => setIsRemanejando(false)}
                  className="px-6 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
