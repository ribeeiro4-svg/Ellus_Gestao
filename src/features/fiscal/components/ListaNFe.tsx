'use client'
import React, { useState, useMemo } from 'react'
import { Search, FileText, CheckCircle, Clock, AlertTriangle, Eye, Trash2, PenLine, RefreshCw, Printer } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente: { label: 'Pendente', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: RefreshCw },
  escriturada: { label: 'Escriturada', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
  com_inconsistencia: { label: 'Inconsistência', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: AlertTriangle },
}

export default function ListaNFe({ nfeHook, onEscriturar }: { nfeHook: any; onEscriturar: (id: string) => void }) {
  const { nfes, loading, remover, filterPeriodo, setFilterPeriodo } = nfeHook
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const visualizarDanfe = async (nfe: any) => {
    let itens = nfe.itens
    if (!itens) {
      itens = await nfeHook.buscarItens(nfe.id)
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const itensHtml = itens?.map((i: any) => `
      <tr style="font-size: 8px;">
        <td style="border:1px solid #000;padding:2px">${i.codigo_produto}</td>
        <td style="border:1px solid #000;padding:2px">${i.descricao_produto}</td>
        <td style="border:1px solid #000;padding:2px;text-align:center">${i.ncm || ''}</td>
        <td style="border:1px solid #000;padding:2px;text-align:center">${i.cst_icms || ''}</td>
        <td style="border:1px solid #000;padding:2px;text-align:center">${i.cfop_nfe || ''}</td>
        <td style="border:1px solid #000;padding:2px;text-align:center">${i.unidade_comercial}</td>
        <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.quantidade).toLocaleString('pt-BR')}</td>
        <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_produto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_bc_icms || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_icms || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.aliq_icms || 0).toLocaleString('pt-BR')}%</td>
      </tr>
    `).join('') || ''

    printWindow.document.write(`
      <html>
        <head>
          <title>DANFE - NF ${nfe.numero_nf}</title>
          <style>
            @page { size: A4 portrait; margin: 1cm; }
            body { font-family: 'Arial Narrow', Arial, sans-serif; margin: 0; padding: 0; font-size: 10px; }
            .box { border: 1px solid #000; padding: 2px; position: relative; }
            .label { font-size: 7px; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; display: block; }
            .value { font-size: 10px; font-weight: bold; }
            .grid { display: grid; border-top: 1px solid #000; border-left: 1px solid #000; }
            .grid > div { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th { border: 1px solid #000; font-size: 8px; background: #eee; padding: 2px; }
            .barcode { letter-spacing: 2px; font-size: 20px; font-family: 'Libre Barcode 39', cursive; }
          </style>
        </head>
        <body>
          <!-- CABEÇALHO -->
          <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <div style="flex: 1; border: 1px solid #000; padding: 5px; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 12px; font-weight: bold; text-align: center;">${nfe.nome_emitente}</div>
              <div style="font-size: 9px; text-align: center; margin-top: 5px;">
                CNPJ: ${nfe.cnpj_emitente} | UF: ${nfe.uf_emitente}<br>
                INSCRIÇÃO ESTADUAL: ${nfe.ie_emitente || 'ISENTO'}<br>
                NATUREZA DA OPERAÇÃO: ${nfe.nat_operacao}
              </div>
            </div>
            <div style="width: 120px; border: 1px solid #000; padding: 5px; text-align: center;">
              <div style="font-size: 14px; font-weight: bold;">DANFE</div>
              <div style="font-size: 8px;">Documento Auxiliar da Nota Fiscal Eletrônica</div>
              <div style="margin: 10px 0; font-size: 11px;">0 - ENTRADA<br>1 - SAÍDA<br><b>${nfe.tp_nf || '1'}</b></div>
              <div style="font-size: 11px; font-weight: bold;">Nº ${nfe.numero_nf}<br>SÉRIE ${nfe.serie || '1'}</div>
            </div>
            <div style="flex: 1.2; border: 1px solid #000; padding: 5px;">
              <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
                <div style="background: #000; height: 35px; width: 100%; margin-bottom: 2px;"></div>
                <div style="font-size: 9px; font-weight: bold;">CHAVE DE ACESSO</div>
                <div style="font-size: 10px;">${nfe.chave_acesso?.replace(/(.{4})/g, '$1 ')}</div>
              </div>
              <div style="text-align: center; font-size: 9px;">
                Consulta de autenticidade no portal nacional da NF-e<br>
                www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
              </div>
            </div>
          </div>

          <!-- PROTOCOLO -->
          <div style="border: 1px solid #000; padding: 4px; font-size: 10px; margin-bottom: 5px; display: flex; justify-content: space-between;">
            <span><b>PROTOCOLO DE AUTORIZAÇÃO DE USO:</b> 1234567890 - 31/01/2024</span>
            <span><b>CNPJ:</b> ${nfe.cnpj_emitente}</span>
          </div>

          <!-- DESTINATÁRIO -->
          <div style="margin-bottom: 5px;">
            <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">DESTINATÁRIO / REMETENTE</div>
            <div class="grid" style="grid-template-columns: 3fr 1fr 1fr;">
              <div style="grid-column: span 1;"><span class="label">NOME / RAZÃO SOCIAL</span><span class="value">${nfe.nome_destinatario}</span></div>
              <div><span class="label">CNPJ/CPF</span><span class="value">${nfe.cnpj_destinatario}</span></div>
              <div><span class="label">DATA EMISSÃO</span><span class="value">${fmtData(nfe.data_emissao)}</span></div>
              <div style="grid-column: span 1;"><span class="label">ENDEREÇO</span><span class="value">DADOS DO ENDEREÇO DA NOTA...</span></div>
              <div><span class="label">UF</span><span class="value">--</span></div>
              <div><span class="label">DATA SAÍDA/ENTRADA</span><span class="value">${fmtData(nfe.data_entrada)}</span></div>
            </div>
          </div>

          <!-- CÁLCULO DO IMPOSTO -->
          <div style="margin-bottom: 5px;">
            <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">CÁLCULO DO IMPOSTO</div>
            <div class="grid" style="grid-template-columns: repeat(5, 1fr);">
              <div><span class="label">BASE CÁLC. ICMS</span><span class="value">${fmtR(nfe.valor_icms > 0 ? nfe.valor_produtos : 0)}</span></div>
              <div><span class="label">VALOR DO ICMS</span><span class="value">${fmtR(nfe.valor_icms)}</span></div>
              <div><span class="label">BASE CÁLC. ICMS ST</span><span class="value">R$ 0,00</span></div>
              <div><span class="label">VALOR DO ICMS ST</span><span class="value">R$ 0,00</span></div>
              <div><span class="label">VALOR TOTAL DOS PRODUTOS</span><span class="value">${fmtR(nfe.valor_produtos)}</span></div>
              <div><span class="label">VALOR DO FRETE</span><span class="value">${fmtR(nfe.valor_frete)}</span></div>
              <div><span class="label">VALOR DO SEGURO</span><span class="value">${fmtR(nfe.valor_seguro)}</span></div>
              <div><span class="label">DESCONTO</span><span class="value">${fmtR(nfe.valor_desconto)}</span></div>
              <div><span class="label">OUTRAS DESPESAS</span><span class="value">R$ 0,00</span></div>
              <div><span class="label">VALOR TOTAL DA NOTA</span><span class="value" style="font-size:12px">${fmtR(nfe.valor_total)}</span></div>
            </div>
          </div>

          <!-- ITENS -->
          <div style="margin-bottom: 5px;">
            <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">DADOS DOS PRODUTOS / SERVIÇOS</div>
            <table>
              <thead>
                <tr>
                  <th>CÓD. PROD.</th>
                  <th>DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</th>
                  <th>NCM/SH</th>
                  <th>CST</th>
                  <th>CFOP</th>
                  <th>UN</th>
                  <th>QTD</th>
                  <th>V. UNIT</th>
                  <th>V. TOTAL</th>
                  <th>BC ICMS</th>
                  <th>V. ICMS</th>
                  <th>% ICMS</th>
                </tr>
              </thead>
              <tbody>${itensHtml}</tbody>
            </table>
          </div>

          <!-- DADOS ADICIONAIS -->
          <div style="margin-top: 10px;">
            <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">DADOS ADICIONAIS</div>
            <div style="border: 1px solid #000; padding: 5px; height: 60px; font-size: 8px;">
              <b>INFORMAÇÕES COMPLEMENTARES:</b><br>
              ${nfe.inf_complementar || 'Nenhuma informação adicional.'}
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const ano = new Date().getFullYear()
  const periodos = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0')
    return { value: `${ano}-${m}`, label: `${meses[i]}/${ano}` }
  })

  const filtered = useMemo(() => nfes.filter((n: any) => {
    const matchSearch = !search || n.nome_emitente?.toLowerCase().includes(search.toLowerCase()) ||
      n.numero_nf?.includes(search) || n.cnpj_emitente?.includes(search)
    const matchStatus = filterStatus === 'ALL' || n.status_escrituracao === filterStatus
    return matchSearch && matchStatus
  }), [nfes, search, filterStatus])

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text" placeholder="Buscar por emitente, número ou CNPJ..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs outline-none font-medium"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}
          className="bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold border-none outline-none">
          <option value="">Todos os períodos</option>
          {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold border-none outline-none">
          <option value="ALL">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="escriturada">Escrituradas</option>
          <option value="com_inconsistencia">Com Inconsistência</option>
        </select>
        <span className="text-xs font-black text-slate-400">{filtered.length} nota(s)</span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <FileText size={40} className="text-slate-200 mb-3" />
          <p className="text-sm font-black text-slate-400">Nenhuma NF-e encontrada</p>
          <p className="text-xs text-slate-300 mt-1">Importe XMLs na aba "Importar NF-e"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((nfe: any) => {
            const stConf = STATUS_CONFIG[nfe.status_escrituracao] ?? STATUS_CONFIG.pendente
            const StIcon = stConf.icon
            return (
              <div key={nfe.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800">NF {nfe.serie && `${nfe.serie}-`}{nfe.numero_nf}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${stConf.bg} ${stConf.color}`}>
                          <StIcon size={9} /> {stConf.label}
                        </span>
                        {nfe.crt_emitente === '1' && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-50 text-yellow-700 border border-yellow-100">
                            Simples Nacional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{nfe.nome_emitente}</p>
                      <p className="text-[10px] text-slate-400">CNPJ: {nfe.cnpj_emitente} • UF: {nfe.uf_emitente}</p>
                      <p className="text-[10px] text-slate-400">{nfe.nat_operacao}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-800">{fmtR(nfe.valor_total)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Emissão: {fmtData(nfe.data_emissao)}</p>
                    <p className="text-[10px] text-slate-400">Entrada: {fmtData(nfe.data_entrada)}</p>
                  </div>
                </div>

                {/* Impostos resumo */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: 'ICMS', value: nfe.valor_icms, color: 'text-purple-600' },
                    { label: 'IPI', value: nfe.valor_ipi, color: 'text-blue-600' },
                    { label: 'PIS', value: nfe.valor_pis, color: 'text-rose-600' },
                    { label: 'COFINS', value: nfe.valor_cofins, color: 'text-orange-600' },
                  ].map((imp, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold">{imp.label}</p>
                      <p className={`text-[10px] font-black ${imp.color}`}>{fmtR(imp.value)}</p>
                    </div>
                  ))}
                </div>

                {/* Chave de acesso */}
                {nfe.chave_acesso && (
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                    <p className="text-[9px] font-mono text-slate-400 truncate">{nfe.chave_acesso}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  {nfe.status_escrituracao !== 'escriturada' && (
                    <button
                      onClick={() => onEscriturar(nfe.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
                    >
                      <PenLine size={11} /> Escriturar
                    </button>
                  )}
                  {nfe.status_escrituracao === 'escriturada' && (
                    <button
                      onClick={() => onEscriturar(nfe.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl transition-all"
                    >
                      <Eye size={11} /> Visualizar
                    </button>
                  )}
                  <button
                    onClick={() => visualizarDanfe(nfe)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
                  >
                    <Printer size={11} /> DANFE (PDF)
                  </button>
                  <button
                    onClick={() => confirm('Excluir esta NF-e e todos os seus itens?') && remover(nfe.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                  >
                    <Trash2 size={11} /> Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
