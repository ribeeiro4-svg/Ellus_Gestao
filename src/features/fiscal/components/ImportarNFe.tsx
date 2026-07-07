'use client'
import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Eye, Loader2, Ban } from 'lucide-react'
import { parseNFeFile, NFeParsed } from '@/features/fiscal/utils/nfeParser'
import { verificarDuplicidadeNFeAction } from '@/features/fiscal/actions/importarNFeAction'
import { useTenantId } from '@/lib/hooks/useTenantId'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => {
  if (!d) return '--'
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d }
}

export default function ImportarNFe({ nfeHook, onImported }: { nfeHook: any; onImported?: () => void }) {
  const tenantId = useTenantId()
  const [dragging, setDragging] = useState(false)
  const [previews, setPreviews] = useState<NFeParsed[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ file: string; ok: boolean; msg: string }[]>([])
  const [duplicatas, setDuplicatas] = useState<Record<string, any>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.name.endsWith('.xml'))
    if (!arr.length) return alert('Selecione arquivos .xml de NF-e')
    const parsed = await Promise.all(arr.map(f => parseNFeFile(f)))
    setPreviews(parsed)
    setResults([])
    setDuplicatas({})
    // Verificar duplicidades no servidor
    if (tenantId) {
      const dups: Record<string, any> = {}
      await Promise.all(parsed.map(async nfe => {
        if (nfe.chaveAcesso && nfe.valido) {
          const result = await verificarDuplicidadeNFeAction(nfe.chaveAcesso, tenantId)
          if (result.duplicada) dups[nfe.chaveAcesso] = result
        }
      }))
      if (Object.keys(dups).length > 0) setDuplicatas(dups)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [])

  const confirmarImportacao = async () => {
    setImporting(true)
    const res: { file: string; ok: boolean; msg: string }[] = []
    for (const nfe of previews) {
      if (!nfe.valido) {
        res.push({ file: `NF-${nfe.numeroNF || '?'}`, ok: false, msg: nfe.erros.join('; ') })
        continue
      }
      const periodoApuracao = nfe.dataEmissao.slice(0, 7) + '-01'
      const result = await nfeHook.importarNFe({
        periodo_apuracao: periodoApuracao,
        chave_acesso: nfe.chaveAcesso,
        numero_nf: nfe.numeroNF,
        serie: nfe.serie,
        data_emissao: nfe.dataEmissao,
        data_entrada: nfe.dataEntrada || nfe.dataEmissao,
        cnpj_emitente: nfe.cnpjEmitente,
        nome_emitente: nfe.nomeEmitente,
        uf_emitente: nfe.ufEmitente,
        crt_emitente: nfe.crtEmitente,
        nat_operacao: nfe.natOperacao,
        valor_produtos: nfe.valorProdutos,
        valor_frete: nfe.valorFrete,
        valor_seguro: nfe.valorSeguro,
        valor_desconto: nfe.valorDesconto,
        valor_ipi: nfe.valorIPI,
        valor_total: nfe.valorTotal,
        valor_icms: nfe.valorICMS,
        valor_pis: nfe.valorPIS,
        valor_cofins: nfe.valorCOFINS,
        inf_complementar: nfe.infComplementar,
        xml_original: nfe.xmlRaw,
        status_escrituracao: 'pendente',
        status_conciliacao: 'pendente',
        status_sefaz: 'autorizada',
      }, nfe.itens.map(item => ({
        numero_item: item.nItem,
        codigo_produto: item.cProd,
        codigo_ean: item.cEAN,
        descricao_produto: item.xProd,
        ncm: item.NCM,
        cest: item.CEST,
        cfop_nfe: item.CFOP,
        unidade_comercial: item.uCom,
        quantidade: item.qCom,
        valor_unitario: item.vUnCom,
        valor_produto: item.vProd,
        valor_frete: item.vFrete,
        valor_seguro: item.vSeg,
        valor_desconto: item.vDesc,
        valor_outro: item.vOutro,
        orig_icms: item.origICMS,
        cst_icms: item.CSTICMS,
        valor_bc_icms: item.vBCICMS,
        aliq_icms: item.pICMS,
        valor_icms: item.vICMS,
        valor_icms_st: item.vICMSST,
        cst_ipi: item.CSTIPI,
        aliq_ipi: item.pIPI,
        valor_ipi: item.vIPI,
        cst_pis: item.CSTPIS,
        aliq_pis: item.pPIS,
        valor_pis: item.vPIS,
        cst_cofins: item.CSTCOFINS,
        aliq_cofins: item.pCOFINS,
        valor_cofins: item.vCOFINS,
        classificado: false,
      })))
      res.push({ file: `NF ${nfe.serie}-${nfe.numeroNF}`, ok: !result.error, msg: result.error || 'Importada com sucesso' })
    }
    setResults(res)
    setImporting(false)
    setPreviews([])
    if (res.every(r => r.ok) && onImported) onImported()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed cursor-pointer transition-all ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".xml" multiple className="hidden" onChange={e => e.target.files && processFiles(e.target.files)} />
        <Upload size={40} className={`mb-4 ${dragging ? 'text-blue-500' : 'text-slate-300'}`} />
        <p className="text-sm font-black text-slate-600">Arraste arquivos XML de NF-e aqui</p>
        <p className="text-xs text-slate-400 mt-1">ou clique para selecionar • Suporta múltiplos arquivos .xml</p>
        <div className="mt-4 flex gap-2 text-[10px] text-slate-400 font-bold">
          <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">NF-e Modelo 55</span>
          <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">XML v4.0+</span>
          <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">Validação automática</span>
        </div>
      </div>

      {/* Preview */}
      {previews.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-700">📋 Prévia — {previews.length} NF-e(s) para importar</h3>
            <div className="flex gap-2">
              <button onClick={() => setPreviews([])} className="px-4 py-2 text-xs font-black text-slate-500 hover:text-red-500 bg-slate-100 rounded-xl transition-all">
                Cancelar
              </button>
              <button
                onClick={confirmarImportacao}
                disabled={importing || previews.every(p => !p.valido) || Object.keys(duplicatas).length > 0}
                className="px-6 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {importing ? 'Importando...' : `Confirmar ${previews.filter(p => p.valido && !duplicatas[p.chaveAcesso]).length} NF-e(s)`}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {previews.map((nfe, i) => (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm p-5 ${!nfe.valido ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${nfe.valido ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {nfe.valido ? <CheckCircle size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">NF-e {nfe.serie ? `${nfe.serie}-` : ''}{nfe.numeroNF || '???'}</p>
                      <p className="text-xs text-slate-500">{nfe.nomeEmitente} — CNPJ: {nfe.cnpjEmitente}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{fmtR(nfe.valorTotal)}</p>
                    <p className="text-[10px] text-slate-400">{fmtData(nfe.dataEmissao)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">Produtos</p>
                    <p className="text-xs font-black text-slate-700">{fmtR(nfe.valorProdutos)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">ICMS</p>
                    <p className="text-xs font-black text-purple-700">{fmtR(nfe.valorICMS)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">IPI</p>
                    <p className="text-xs font-black text-blue-700">{fmtR(nfe.valorIPI)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">Itens</p>
                    <p className="text-xs font-black text-slate-700">{nfe.itens.length}</p>
                  </div>
                </div>
                {nfe.crtEmitente === '1' && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-lg">
                    <AlertTriangle size={11} /> Emitente Simples Nacional (CRT=1) — usar CSOSN ao invés de CST ICMS regular
                  </div>
                )}
                {/* Badge de duplicata — mostra informações da nota já existente */}
                {duplicatas[nfe.chaveAcesso] && (
                  <div className="mt-2 flex items-start gap-2 text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                    <Ban size={12} className="shrink-0 mt-0.5" />
                    <span>
                      ❌ JÁ IMPORTADA — Status: <strong>{duplicatas[nfe.chaveAcesso].status?.toUpperCase()}</strong>
                      {duplicatas[nfe.chaveAcesso].data_escrituracao && ` | Escriturada em: ${new Date(duplicatas[nfe.chaveAcesso].data_escrituracao).toLocaleDateString('pt-BR')}`}
                      <br/>Esta NF-e já existe no banco. Não é possível importar novamente.
                    </span>
                  </div>
                )}
                {!nfe.valido && (
                  <div className="mt-2 p-2 bg-red-50 rounded-xl">
                    {nfe.erros.map((e, j) => <p key={j} className="text-[10px] text-red-600 font-bold">⚠️ {e}</p>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-black text-slate-700">Resultado da Importação</h3>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${r.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              {r.ok ? <CheckCircle size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-red-500" />}
              <span className="text-xs font-bold text-slate-700">{r.file}</span>
              <span className={`text-xs ${r.ok ? 'text-emerald-600' : 'text-red-600'}`}>{r.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <h4 className="text-xs font-black text-blue-800 mb-2">📘 Como funciona a importação</h4>
        <div className="grid grid-cols-2 gap-3 text-[10px] text-blue-700 font-medium">
          <div>✅ Valida estrutura XML (MOC NF-e v4.0+)</div>
          <div>✅ Verifica chave de acesso (Módulo 11)</div>
          <div>✅ Controla duplicidade por chave</div>
          <div>✅ Detecta emitentes do Simples Nacional</div>
          <div>✅ Extrai todos os impostos por item</div>
          <div>✅ Integra com módulo Financeiro</div>
        </div>
      </div>
    </div>
  )
}
