'use client'
import React, { useState, useEffect } from 'react'
import { Save, CheckCircle, AlertTriangle, ChevronDown, Loader2, FileText, Copy, X } from 'lucide-react'
import { TABELA_CFOP, buscarCFOP } from '@/features/fiscal/utils/tabelasCFOP'
import { CST_ICMS_TRIBUTACAO, CST_IPI_ENTRADA, CST_PIS_COFINS, DESTINACOES_ITEM } from '@/features/fiscal/utils/tabelasCST'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { useProdutosEstoque } from '@/features/fiscal/hooks/useProdutosEstoque'
import { useIntegracaoFiscalContabil } from '@/features/fiscal/hooks/useIntegracaoFiscalContabil'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

import { getFornecedorByCpfCnpjAction } from '@/features/fiscal/actions/nfseActions'
import NFSeEscrituracaoModal from './nfse/NFSeEscrituracaoModal'

export default function EscrituracaoNFe({ nfeHook, nfeIdInicial }: { nfeHook: any; nfeIdInicial: string | null }) {
  const { nfes, buscarItens, salvarClassificacao } = nfeHook
  const planoHook = usePlanoContas()
  const estoqueHook = useProdutosEstoque()
  const integracaoHook = useIntegracaoFiscalContabil()
  
  const [selectedNfeId, setSelectedNfeId] = useState<string>(nfeIdInicial || '')
  const [itens, setItens] = useState<any[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vinculoData, setVinculoData] = useState<any>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('acprobec_nfe_presets')
    if (saved) setPresets(JSON.parse(saved))
  }, [])

  const nfeSelecionada = nfes.find((n: any) => n.id === selectedNfeId)

  useEffect(() => {
    if (nfeIdInicial) setSelectedNfeId(nfeIdInicial)
  }, [nfeIdInicial])

  useEffect(() => {
    if (!selectedNfeId) { setItens([]); return }
    setLoadingItens(true)
    buscarItens(selectedNfeId).then((data: any[]) => {
      setItens(data.map(item => ({ ...item, _cfopSearch: '' })))
      setLoadingItens(false)
    })
  }, [selectedNfeId])

  const updateItem = (idx: number, field: string, value: any) => {
    setItens(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const aplicarTodosNCM = (ncm: string, field: string, value: any) => {
    setItens(prev => prev.map(item => item.ncm === ncm ? { ...item, [field]: value } : item))
  }

  const replicarPrimeiroItem = () => {
    if (itens.length < 1) return
    const p = itens[0]
    setItens(prev => prev.map((item, i) => i === 0 ? item : {
      ...item,
      cfop_escrituracao: p.cfop_escrituracao,
      cst_icms: p.cst_icms,
      cst_pis: p.cst_pis,
      cst_cofins: p.cst_cofins,
      cst_ipi: p.cst_ipi,
      destinacao_item: p.destinacao_item,
      conta_contabil_id: p.conta_contabil_id,
      aproveitamento_credito: p.aproveitamento_credito
    }))
  }

  const salvarPreset = () => {
    if (itens.length < 1 || !presetName) return
    const p = itens[0]
    const newPreset = {
      nome: presetName,
      cfop: p.cfop_escrituracao,
      icms: p.cst_icms,
      pis: p.cst_pis,
      cofins: p.cst_cofins,
      ipi: p.cst_ipi,
      dest: p.destinacao_item,
      conta: p.conta_contabil_id,
      credito: p.aproveitamento_credito
    }
    const updated = [...presets, newPreset]
    setPresets(updated)
    localStorage.setItem('acprobec_nfe_presets', JSON.stringify(updated))
    setPresetName('')
    setShowPresets(false)
  }

  const aplicarPreset = (p: any) => {
    setItens(prev => prev.map(item => ({
      ...item,
      cfop_escrituracao: p.cfop,
      cst_icms: p.icms,
      cst_pis: p.pis,
      cst_cofins: p.cofins,
      cst_ipi: p.ipi,
      destinacao_item: p.dest,
      conta_contabil_id: p.conta,
      aproveitamento_credito: p.credito
    })))
  }

  const excluirPreset = (idx: number) => {
    const updated = presets.filter((_, i) => i !== idx)
    setPresets(updated)
    localStorage.setItem('acprobec_nfe_presets', JSON.stringify(updated))
  }

  const salvar = async () => {
    if (!selectedNfeId) return
    setSaving(true)
    const result = await salvarClassificacao(selectedNfeId, itens)
    setSaving(false)
    if (result.error) alert(`Erro: ${result.error}`)
    else {
      alert('Escrituração salva com sucesso!')
      nfeHook.refresh()
    }
  }

  const finalizar = async () => {
    if (!selectedNfeId || !nfeSelecionada) return
    
    // 1. Buscar Fornecedor pelo CNPJ da nota
    setSaving(true)
    const resFor = await getFornecedorByCpfCnpjAction(nfeSelecionada.cnpj_emitente)
    setSaving(false)

    if (!resFor.data) {
      alert('Fornecedor (Emitente) não encontrado no sistema. Por favor, cadastre o fornecedor antes de escriturar a nota.')
      return
    }

    // 2. Abrir Modal de Vínculo Financeiro
    setVinculoData({
      nota: {
        id: nfeSelecionada.id,
        numero_nfse: nfeSelecionada.numero_nf, // Adaptado para o modal reutilizado
        valor_liquido: nfeSelecionada.valor_total,
        data_emissao: nfeSelecionada.data_emissao,
        prestador_id: resFor.data.id,
        descricao_servico: `NF-e ${nfeSelecionada.numero_nf} - ${nfeSelecionada.nome_emitente}`
      },
      prestador: {
        razao_social: nfeSelecionada.nome_emitente,
        cnpj: nfeSelecionada.cnpj_emitente
      }
    })
    setIsModalOpen(true)
  }

  const handleSubmitVinculo = async (payload: any) => {
    setSaving(true)
    try {
      // Primeiro salva a classificação dos itens
      const saveRes = await salvarClassificacao(selectedNfeId, itens)
      if (saveRes.error) throw new Error(saveRes.error)

      // Depois integra com o financeiro selecionado
      const result = await integracaoHook.finalizarEscrituracao(selectedNfeId, payload.financeiroId)
      
      if (result.error) alert(`Erro na integração: ${result.error}`)
      else {
        alert('Escrituração finalizada e vinculada ao financeiro com sucesso!')
        setIsModalOpen(false)
        nfeHook.refresh()
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const totalClassificados = itens.filter(i => i.cfop_escrituracao && i.destinacao_item && i.conta_contabil_id).length
  const pct = itens.length > 0 ? Math.round((totalClassificados / itens.length) * 100) : 0

  const getAlertas = (item: any) => {
    const alertas: string[] = []
    if (item.cfop_escrituracao && ['5', '6', '7'].includes(item.cfop_escrituracao?.[0])) {
      alertas.push('⚠️ CFOP de saída! Use CFOPs de entrada')
    }
    return alertas
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-700 mb-3">Selecionar NF-e para Escriturar</h3>
        <div className="flex items-center gap-3">
          <select
            value={selectedNfeId}
            onChange={e => setSelectedNfeId(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
          >
            <option value="">-- Selecione uma NF-e --</option>
            {nfes.map((nfe: any) => (
              <option key={nfe.id} value={nfe.id}>
                NF {nfe.serie && `${nfe.serie}-`}{nfe.numero_nf} | {nfe.nome_emitente} | {fmtR(nfe.valor_total)} | {nfe.status_escrituracao}
              </option>
            ))}
          </select>
          {itens.length > 0 && (
            <button
              onClick={salvar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Salvando...' : 'Salvar Escrituração'}
            </button>
          )}
        </div>

        {nfeSelecionada && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Emitente</p>
              <p className="text-xs font-black text-slate-700 truncate">{nfeSelecionada.nome_emitente}</p>
              <p className="text-[9px] text-slate-400">{nfeSelecionada.cnpj_emitente}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Valores</p>
              <p className="text-xs font-black text-slate-700">{fmtR(nfeSelecionada.valor_total)}</p>
              <p className="text-[9px] text-slate-400">ICMS: {fmtR(nfeSelecionada.valor_icms)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Progresso</p>
              <p className="text-xs font-black text-slate-700">{totalClassificados}/{itens.length} itens</p>
              <div className="h-1 bg-slate-200 rounded-full mt-1">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {loadingItens && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="ml-2 text-sm font-bold text-slate-500">Carregando itens...</span>
        </div>
      )}

      {!loadingItens && itens.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Toolbar de Ações em Lote */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={replicarPrimeiroItem}
                className="flex items-center gap-2 px-4 py-2 text-[11px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                title="Copia a tributação do primeiro item para todos os outros"
              >
                <Copy size={14} /> Replicar 1º Item p/ Todos
              </button>

              <div className="h-6 w-[1px] bg-slate-100 mx-1" />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-2 px-4 py-2 text-[11px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                >
                  <Save size={14} /> Presets de Tributação
                </button>
                
                {showPresets && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input 
                      type="text" 
                      placeholder="Nome do preset..."
                      value={presetName}
                      onChange={e => setPresetName(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none w-32"
                    />
                    <button
                      onClick={salvarPreset}
                      disabled={!presetName}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {presets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Aplicar:</span>
                <div className="flex flex-wrap gap-1">
                  {presets.map((p, pi) => (
                    <div key={pi} className="group relative">
                      <button
                        onClick={() => aplicarPreset(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-black transition-all"
                      >
                        {p.nome}
                      </button>
                      <button 
                        onClick={() => excluirPreset(pi)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <X size={8} strokeWidth={4} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase w-10">#</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase w-64">Produto / Info NF</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase w-48">CFOP Escrituração *</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase w-32">ICMS / IPI</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase w-32">PIS / COFINS</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase w-48">Destinação *</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Conta Contábil (Débito) *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {itens.map((item, idx) => {
                    const alertas = getAlertas(item)
                    const classificado = !!(item.cfop_escrituracao && item.destinacao_item && item.conta_contabil_id)
                    
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${classificado ? 'bg-emerald-50/10' : 'bg-white'}`}>
                        <td className="px-4 py-4 align-top">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${classificado ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {idx + 1}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="text-[11px] font-black text-slate-800 leading-tight mb-1">{item.descricao_produto}</p>
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[8px] text-slate-400 font-bold uppercase">
                            <span className="bg-slate-100 px-1 rounded">NCM: {item.ncm}</span>
                            <span className="bg-slate-100 px-1 rounded">Qtd: {item.quantidade}</span>
                            <span className="bg-blue-50 text-blue-600 px-1 rounded">Vlr: {fmtR(item.valor_produto)}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {alertas.map((al, ai) => (
                              <div key={ai} className="flex items-center gap-1 text-[8px] font-bold text-orange-600">
                                <AlertTriangle size={8} /> {al}
                              </div>
                            ))}
                            {item.ncm && itens.filter(i => i.ncm === item.ncm).length > 1 && (
                              <button
                                onClick={() => {
                                  aplicarTodosNCM(item.ncm, 'cfop_escrituracao', item.cfop_escrituracao)
                                  aplicarTodosNCM(item.ncm, 'cst_icms', item.cst_icms)
                                  aplicarTodosNCM(item.ncm, 'destinacao_item', item.destinacao_item)
                                }}
                                className="flex items-center gap-1 text-[8px] font-black text-blue-600 hover:underline"
                              >
                                <Copy size={8} /> Clonar p/ mesmo NCM
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-4 align-top">
                          <select
                            value={item.cfop_escrituracao || ''}
                            onChange={e => updateItem(idx, 'cfop_escrituracao', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400 transition-all"
                          >
                            <option value="">Selecionar CFOP...</option>
                            {TABELA_CFOP.map(c => (
                              <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>
                            ))}
                          </select>
                          <p className="text-[8px] text-slate-400 mt-1 font-bold italic">CFOP NF: {item.cfop_nfe}</p>
                        </td>

                        <td className="px-3 py-4 align-top space-y-2">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">CST ICMS</p>
                            <select
                              value={item.cst_icms || ''}
                              onChange={e => updateItem(idx, 'cst_icms', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                            >
                              <option value="">CST...</option>
                              {CST_ICMS_TRIBUTACAO.map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.descricao}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">CST IPI</p>
                            <select
                              value={item.cst_ipi || ''}
                              onChange={e => updateItem(idx, 'cst_ipi', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                            >
                              <option value="">CST...</option>
                              {CST_IPI_ENTRADA.map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.descricao}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-top space-y-2">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">CST PIS</p>
                            <select
                              value={item.cst_pis || ''}
                              onChange={e => updateItem(idx, 'cst_pis', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                            >
                              <option value="">CST...</option>
                              {CST_PIS_COFINS.map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.descricao}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">CST COFINS</p>
                            <select
                              value={item.cst_cofins || ''}
                              onChange={e => updateItem(idx, 'cst_cofins', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                            >
                              <option value="">CST...</option>
                              {CST_PIS_COFINS.map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.descricao}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-top">
                          <select
                            value={item.destinacao_item || ''}
                            onChange={e => updateItem(idx, 'destinacao_item', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400 transition-all"
                          >
                            <option value="">Destinação...</option>
                            {DESTINACOES_ITEM.map(d => (
                              <option key={d.codigo} value={d.codigo}>{d.descricao}</option>
                            ))}
                          </select>
                          {(item.destinacao_item === '4' || item.destinacao_item === '7' || item.destinacao_item === '8') && (
                            <div className="mt-2">
                              <p className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">Vincular Produto</p>
                              <select
                                value={item.produto_vinc_id || ''}
                                onChange={e => updateItem(idx, 'produto_vinc_id', e.target.value)}
                                className="w-full px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-bold outline-none"
                              >
                                <option value="">Auto-cadastro...</option>
                                {estoqueHook.produtos.map((p: any) => (
                                  <option key={p.id} value={p.id}>{p.descricao}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <select
                            value={item.conta_contabil_id || ''}
                            onChange={e => updateItem(idx, 'conta_contabil_id', e.target.value)}
                            className="w-full px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold outline-none focus:border-indigo-400 transition-all"
                          >
                            <option value="">Selecionar conta...</option>
                            {planoHook.contasAnaliticas.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.codigo} — {c.descricao}</option>
                            ))}
                          </select>
                          <div className="mt-2 flex items-center gap-2">
                             <input
                              type="checkbox"
                              checked={item.aproveitamento_credito || false}
                              onChange={e => updateItem(idx, 'aproveitamento_credito', e.target.checked)}
                              className="w-3 h-3 accent-blue-600"
                            />
                            <input
                              type="text"
                              placeholder="Obs fiscal..."
                              value={item.obs_fiscal || ''}
                              onChange={e => updateItem(idx, 'obs_fiscal', e.target.value)}
                              className="flex-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-medium outline-none"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={salvar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Processando...' : 'Apenas Salvar'}
            </button>
            <button
              onClick={finalizar}
              disabled={saving || totalClassificados < itens.length}
              className="flex items-center gap-2 px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {saving ? 'Finalizando...' : `Finalizar e Integrar (${totalClassificados}/${itens.length})`}
            </button>
          </div>
        </div>
      )}

      {!loadingItens && !selectedNfeId && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <FileText size={40} className="text-slate-200 mb-3" />
          <p className="text-sm font-black text-slate-400">Selecione uma NF-e acima para iniciar a escrituração</p>
        </div>
      )}
      {/* Modal de Vínculo Financeiro */}
      <NFSeEscrituracaoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nfseData={vinculoData}
        onSubmit={handleSubmitVinculo}
      />
    </div>
  )
}
