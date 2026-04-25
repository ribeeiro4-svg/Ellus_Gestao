'use client'
import React, { useState, useEffect } from 'react'
import { Search, Link as LinkIcon, FileText, Landmark, X, Loader2, Check } from 'lucide-react'
import { buscarCandidatosVincularAction, vincularEDocumentoReprocessarAction } from '../actions/documentLinkActions'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function VincularDocumentoModal({ 
  lancamento, 
  onClose, 
  onSuccess 
}: { 
  lancamento: any, 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<{ financial: any[], nfse: any[], nfe: any[] }>({
    financial: [], nfse: [], nfe: []
  })
  const [linkingId, setLinkingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [lancamento.id])

  async function load() {
    setLoading(true)
    const res = await buscarCandidatosVincularAction(lancamento.id)
    if (res.success && res.data) {
      setCandidates(res.data)
    }
    setLoading(false)
  }

  async function handleLink(docType: 'financeiro' | 'nfse' | 'nfe', docId: string) {
    if (!confirm('Deseja vincular este documento ao lançamento contábil? A integração será reprocessada.')) return
    setLinkingId(docId)
    const res = await vincularEDocumentoReprocessarAction({
      lancamentoId: lancamento.id,
      docType,
      docId
    })
    setLinkingId(null)
    if (res.success) {
      alert('Vínculo realizado e integração reprocessada com sucesso!')
      onSuccess()
    } else {
      alert(`Erro: ${res.error}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Vincular Documento</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Ref: {lancamento.numero_lancamento} — {lancamento.historico}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Buscando candidatos ideais...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Seção Financeiro */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Landmark size={16} />
                  </div>
                  <h4 className="text-xs font-black text-slate-700 uppercase">Financeiro (Pagamentos/Recebimentos)</h4>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {candidates.financial.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-medium bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">Nenhum lançamento financeiro similar encontrado.</p>
                  ) : (
                    candidates.financial.map(item => (
                      <div key={item.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-blue-600 mb-0.5 uppercase tracking-tighter">{item.tipo}</p>
                          <p className="text-xs font-black text-slate-800 truncate">{item.descricao}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(item.data).toLocaleDateString()} • {fmtR(item.valor)}</p>
                        </div>
                        <button 
                          onClick={() => handleLink('financeiro', item.id)}
                          disabled={linkingId === item.id}
                          className="ml-4 p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          {linkingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Seção Notas Fiscais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FileText size={16} />
                  </div>
                  <h4 className="text-xs font-black text-slate-700 uppercase">Notas Fiscais (NFe / NFSe)</h4>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {[...candidates.nfse, ...candidates.nfe].length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-medium bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">Nenhuma nota fiscal vinculada ao termo encontrada.</p>
                  ) : (
                    <>
                      {candidates.nfse.map(item => (
                        <div key={item.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-emerald-600 mb-0.5 uppercase tracking-tighter">NFS-e • {item.numero_nfse}</p>
                            <p className="text-xs font-black text-slate-800 truncate">{item.fornecedores?.nome || 'Prestador não identificado'}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(item.data_emissao).toLocaleDateString()} • {fmtR(item.valor_bruto)}</p>
                          </div>
                          <button 
                            onClick={() => handleLink('nfse', item.id)}
                            disabled={linkingId === item.id}
                            className="ml-4 p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            {linkingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                          </button>
                        </div>
                      ))}
                      {candidates.nfe.map(item => (
                        <div key={item.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-emerald-600 mb-0.5 uppercase tracking-tighter">NF-e • {item.numero_nf}</p>
                            <p className="text-xs font-black text-slate-800 truncate">{item.nome_emitente}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(item.data_emissao).toLocaleDateString()} • {fmtR(item.valor_total)}</p>
                          </div>
                          <button 
                            onClick={() => handleLink('nfe', item.id)}
                            disabled={linkingId === item.id}
                            className="ml-4 p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            {linkingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight max-w-md leading-relaxed">
            * O reprocessamento da integração atualizará o número do documento no Livro Diário e garantirá que as contas contábeis estejam sincronizadas com a origem fiscal/financeira.
          </p>
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-300 transition-all uppercase tracking-widest">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
