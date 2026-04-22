'use client'
import React, { useState, useEffect } from 'react'
import { Save, CheckCircle, AlertTriangle, ChevronDown, Loader2, FileText, Copy } from 'lucide-react'
import { TABELA_CFOP, buscarCFOP } from '@/features/fiscal/utils/tabelasCFOP'
import { CST_ICMS_TRIBUTACAO, CST_IPI_ENTRADA, CST_PIS_COFINS, DESTINACOES_ITEM } from '@/features/fiscal/utils/tabelasCST'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { useProdutosEstoque } from '@/features/fiscal/hooks/useProdutosEstoque'
import { useIntegracaoFiscalContabil } from '@/features/fiscal/hooks/useIntegracaoFiscalContabil'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function EscrituracaoNFe({ nfeHook, nfeIdInicial }: { nfeHook: any; nfeIdInicial: string | null }) {
  const { nfes, buscarItens, salvarClassificacao } = nfeHook
  const planoHook = usePlanoContas()
  const estoqueHook = useProdutosEstoque()
  const integracaoHook = useIntegracaoFiscalContabil()
  
  const [selectedNfeId, setSelectedNfeId] = useState<string>(nfeIdInicial || '')
  const [itens, setItens] = useState<any[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cfopSearch, setCfopSearch] = useState('')

  const nfePendentes = nfes.filter((n: any) => n.status_escrituracao !== 'escriturada')
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
    if (!selectedNfeId) return
    if (!confirm('Deseja finalizar a escrituração e gerar os lançamentos contábeis? Esta ação não pode ser desfeita.')) return
    
    setSaving(true)
    // Primeiro salvar a classificação atual
    await salvarClassificacao(selectedNfeId, itens)
    // Depois integrar
    const result = await integracaoHook.finalizarEscrituracao(selectedNfeId)
    setSaving(false)
    
    if (result.error) alert(`Erro na integração: ${result.error}`)
    else {
      alert('Escrituração finalizada e integrada com sucesso!')
      nfeHook.refresh()
    }
  }

  const totalClassificados = itens.filter(i => i.cfop_escrituracao && i.destinacao_item).length
  const pct = itens.length > 0 ? Math.round((totalClassificados / itens.length) * 100) : 0

  // Alertas
  const getAlertas = (item: any) => {
    const alertas: string[] = []
    if (item.cfop_escrituracao && ['5', '6', '7'].includes(item.cfop_escrituracao?.[0])) {
      alertas.push('⚠️ CFOP de saída! Use CFOPs de entrada (1.xxx, 2.xxx, 3.xxx)')
    }
    if (nfeSelecionada?.crt_emitente === '1' && item.cst_icms && item.cst_icms.length === 2) {
      alertas.push('⚠️ Emitente Simples Nacional — use CSOSN ao invés de CST ICMS regular')
    }
    if (item.destinacao_item === '4') {
      alertas.push('ℹ️ Ativo Imobilizado — cadastre o bem no Controle de Imobilizado')
    }
    return alertas
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Seleção da NF-e */}
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

        {/* Info da NF selecionada */}
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

      {/* Grade de itens */}
      {loadingItens && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="ml-2 text-sm font-bold text-slate-500">Carregando itens...</span>
        </div>
      )}

      {!loadingItens && itens.length > 0 && (
        <div className="flex flex-col gap-4">
          {itens.map((item, idx) => {
            const alertas = getAlertas(item)
            const classificado = !!(item.cfop_escrituracao && item.destinacao_item)
            return (
              <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${classificado ? 'border-emerald-100' : 'border-orange-100'}`}>
                {/* Header do item */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${classificado ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.descricao_produto}</p>
                      <div className="flex gap-2 text-[9px] text-slate-400 font-bold mt-0.5">
                        <span>Cód: {item.codigo_produto}</span>
                        {item.ncm && <span>NCM: {item.ncm}</span>}
                        <span>CFOP NF-e: {item.cfop_nfe}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-slate-800">{fmtR(item.valor_produto)}</p>
                    <p className="text-[10px] text-slate-400">{item.quantidade} {item.unidade_comercial}</p>
                    <p className="text-[9px] text-slate-400">Unit: {fmtR(item.valor_unitario)}</p>
                  </div>
                </div>

                {/* Impostos da NF */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'CST ICMS', value: item.cst_icms, color: 'purple' },
                    { label: 'ICMS', value: fmtR(item.valor_icms), color: 'purple' },
                    { label: 'CST IPI', value: item.cst_ipi, color: 'blue' },
                    { label: 'IPI', value: fmtR(item.valor_ipi), color: 'blue' },
                  ].map((t, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold">{t.label} (NF)</p>
                      <p className="text-[10px] font-black text-slate-700">{t.value || '--'}</p>
                    </div>
                  ))}
                </div>

                {/* Campos de classificação */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* CFOP de Escrituração */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">CFOP Escrituração *</label>
                    <select
                      value={item.cfop_escrituracao || ''}
                      onChange={e => updateItem(idx, 'cfop_escrituracao', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-400 focus:bg-blue-50 transition-all"
                    >
                      <option value="">Selecionar CFOP...</option>
                      {TABELA_CFOP.map(c => (
                        <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* CST ICMS */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">CST ICMS</label>
                    <select
                      value={item.cst_icms || ''}
                      onChange={e => updateItem(idx, 'cst_icms', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                    >
                      <option value="">Selecionar...</option>
                      {CST_ICMS_TRIBUTACAO.map(c => (
                        <option key={c.codigo} value={c.codigo}>{c.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* CST IPI */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">CST IPI</label>
                    <select
                      value={item.cst_ipi || ''}
                      onChange={e => updateItem(idx, 'cst_ipi', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                    >
                      <option value="">Selecionar...</option>
                      {CST_IPI_ENTRADA.map(c => (
                        <option key={c.codigo} value={c.codigo}>{c.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* CST PIS */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">CST PIS</label>
                    <select
                      value={item.cst_pis || ''}
                      onChange={e => updateItem(idx, 'cst_pis', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                    >
                      <option value="">Selecionar...</option>
                      {CST_PIS_COFINS.map(c => (
                        <option key={c.codigo} value={c.codigo}>{c.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* CST COFINS */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">CST COFINS</label>
                    <select
                      value={item.cst_cofins || ''}
                      onChange={e => updateItem(idx, 'cst_cofins', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                    >
                      <option value="">Selecionar...</option>
                      {CST_PIS_COFINS.map(c => (
                        <option key={c.codigo} value={c.codigo}>{c.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* Destinação */}
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Destinação *</label>
                    <select
                      value={item.destinacao_item || ''}
                      onChange={e => updateItem(idx, 'destinacao_item', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                    >
                      <option value="">Selecionar destinação...</option>
                      {DESTINACOES_ITEM.map(d => (
                        <option key={d.codigo} value={d.codigo}>{d.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* Conta Contábil */}
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Conta Contábil (Débito) *</label>
                    <select
                      value={item.conta_contabil_id || ''}
                      onChange={e => updateItem(idx, 'conta_contabil_id', e.target.value)}
                      className="w-full px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all"
                    >
                      <option value="">Vincular conta do plano...</option>
                      {planoHook.contasAnaliticas.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.codigo} — {c.descricao}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vínculo com Produto (Estoque) */}
                  {(item.destinacao_item === '3' || item.destinacao_item === '7') && (
                    <div className="col-span-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Vincular ao Produto (Estoque)</label>
                      <select
                        value={item.produto_vinc_id || ''}
                        onChange={e => updateItem(idx, 'produto_vinc_id', e.target.value)}
                        className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-400 transition-all"
                      >
                        <option value="">Selecionar produto...</option>
                        {estoqueHook.produtos.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.descricao} ({p.codigo_interno})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Aproveitamento de crédito */}
                <div className="mt-3 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.aproveitamento_credito || false}
                      onChange={e => updateItem(idx, 'aproveitamento_credito', e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-600">Aproveitamento de crédito tributário</span>
                  </label>
                  {!item.aproveitamento_credito && (
                    <input
                      type="text"
                      placeholder="Motivo do não aproveitamento..."
                      value={item.motivo_nao_aproveitamento || ''}
                      onChange={e => updateItem(idx, 'motivo_nao_aproveitamento', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none"
                    />
                  )}
                </div>

                {/* Obs fiscal */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Observação fiscal (registro C195 do SPED)..."
                    value={item.obs_fiscal || ''}
                    onChange={e => updateItem(idx, 'obs_fiscal', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                {/* Copiar para mesmo NCM */}
                {item.ncm && itens.filter(i => i.ncm === item.ncm).length > 1 && (
                  <button
                    onClick={() => {
                      aplicarTodosNCM(item.ncm, 'cfop_escrituracao', item.cfop_escrituracao)
                      aplicarTodosNCM(item.ncm, 'cst_icms', item.cst_icms)
                      aplicarTodosNCM(item.ncm, 'destinacao_item', item.destinacao_item)
                    }}
                    className="mt-2 flex items-center gap-1 text-[9px] font-black text-blue-600 hover:underline"
                  >
                    <Copy size={9} /> Aplicar mesma classificação a todos com NCM {item.ncm}
                  </button>
                )}

                {/* Alertas */}
                {alertas.map((al, ai) => (
                  <div key={ai} className="mt-2 flex items-center gap-2 text-[10px] font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                    <AlertTriangle size={10} /> {al}
                  </div>
                ))}

                {/* Status de classificação */}
                <div className={`mt-3 h-0.5 rounded-full ${classificado ? 'bg-emerald-400' : 'bg-orange-300'}`} />
              </div>
            )
          })}

          {/* Botão salvar final */}
          <div className="flex justify-end gap-3">
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
              className="flex items-center gap-2 px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
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
    </div>
  )
}
