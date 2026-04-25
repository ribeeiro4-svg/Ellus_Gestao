
'use client'
import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, Info, FileText, Landmark, ShieldCheck, Calculator } from 'lucide-react'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { fmtR, fmtData } from '@/lib/utils/formatters'

export default function NFSeEscrituracaoModal({ 
  isOpen, 
  onClose, 
  nfseData, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  nfseData: any; 
  onSubmit: (data: any) => Promise<void> 
}) {
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const planoHook = usePlanoContas()

  useEffect(() => {
    if (isOpen && nfseData) {
      setFormData({
        ...nfseData.nota,
        conta_despesa_id: nfseData.nota.conta_despesa_id || '',
        centro_custo_id: '',
        projeto_id: ''
      })
    }
  }, [isOpen, nfseData])

  if (!isOpen || !nfseData) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const { nota, prestador } = nfseData

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', animation: 'overlayIn .2s ease both' }}
    >
      <div 
        className="w-full max-w-[900px] max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="px-8 py-6 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Escrituração NFS-e {nota.numero_nfse}</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-80">Processamento Fiscal Inteligente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
          {/* Coluna Esquerda: Dados da Nota */}
          <div className="flex-1 space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldCheck size={12} className="text-blue-500" />
                Dados do Prestador
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-black text-slate-800">{prestador.razao_social}</p>
                <p className="text-xs font-bold text-slate-500">{prestador.cnpj}</p>
                {prestador.inscricao_municipal && <p className="text-[10px] text-slate-400 mt-1">IM: {prestador.inscricao_municipal}</p>}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calculator size={12} className="text-blue-500" />
                Resumo de Valores & Retenções
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Valor Bruto</p>
                  <p className="text-sm font-black text-slate-800">{fmtR(nota.valor_bruto)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-[9px] font-black text-blue-400 uppercase">Valor Líquido</p>
                  <p className="text-sm font-black text-blue-700">{fmtR(nota.valor_liquido)}</p>
                </div>
              </div>
              
              <div className="mt-3 space-y-2 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">IRRF (1.5%)</span>
                  <span className="font-black text-orange-600">{fmtR(nota.valor_irrf)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">PCC (4.65%)</span>
                  <span className="font-black text-orange-600">{fmtR(nota.valor_pcc_total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">ISS {nota.iss_retido ? '(Retido)' : ''}</span>
                  <span className={`font-black ${nota.iss_retido ? 'text-orange-600' : 'text-slate-400'}`}>{fmtR(nota.valor_iss)}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Discriminação do Serviço</h3>
              <div className="p-4 bg-slate-50 rounded-2xl text-[11px] font-medium text-slate-600 italic border border-slate-100">
                {nota.descricao_servico || 'Sem descrição informada no XML.'}
              </div>
            </section>
          </div>

          {/* Coluna Direita: Classificação */}
          <div className="flex-1 space-y-6 lg:border-l lg:pl-8 border-slate-100">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Conta Contábil de Dispêndio (Débito)</label>
                <select
                  required
                  value={formData.conta_despesa_id}
                  onChange={e => setFormData({...formData, conta_despesa_id: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all"
                >
                  <option value="">Selecione uma conta...</option>
                  {planoHook.contasAnaliticas.filter((c: any) => c.codigo.startsWith('4')).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.codigo} — {c.descricao}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-2 font-medium">Contas de Resultado (Despesas/Custos) conforme ITG 2002.</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Projeto / Convênio</label>
                <select
                  value={formData.projeto_id}
                  onChange={e => setFormData({...formData, projeto_id: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all"
                >
                  <option value="">Geral (Sem vínculo)</option>
                  {/* Projetos seriam mapeados aqui */}
                </select>
              </div>

              <div className="p-5 bg-blue-50 rounded-[24px] border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Landmark size={14} className="text-blue-600" />
                  <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Ações Automáticas</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[10px] font-bold text-blue-700">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                    Geração de partida dobrada no Livro Diário
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-bold text-blue-700">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                    Criação de título a pagar de {fmtR(nota.valor_liquido)}
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-bold text-blue-700">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                    Mapeamento de guias de impostos retidos
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.conta_despesa_id}
                  className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                  Finalizar Escrituração
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
