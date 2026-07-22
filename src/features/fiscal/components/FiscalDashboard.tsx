import React, { useState, useMemo } from 'react'
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, Package, BarChart3, Calendar, Maximize2, X } from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function FiscalDashboard({ nfeHook, estoqueHook, nfseHook }: { nfeHook: any; estoqueHook: any; nfseHook?: any }) {
  const { stats, nfes } = nfeHook
  const estoqueStats = estoqueHook.stats
  const nfseStats = nfseHook ? nfseHook.stats : { total: 0, pendentes: 0, concluidas: 0, valorTotal: 0, valorRetencoes: 0 }
  const [expandedChart, setExpandedChart] = useState<any>(null)

  const getMaxDateStr = (items: any[], field: string) => {
    if (!items || items.length === 0) return '--'
    const dates = items.map((x: any) => new Date(x[field])).filter(d => !isNaN(d.getTime()))
    if (dates.length === 0) return '--'
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    return maxDate.toLocaleDateString('pt-BR')
  }

  const chartConfigs = useMemo(() => ({
    nfe: {
      id: 'nfe',
      title: 'Raio-X: Mercadorias (NF-e)',
      subtitle: 'Conformidade Fiscal Mod 55',
      icon: <Package size={16} />,
      chartType: 'doughnut',
      chartData: {
        labels: ['Escrituradas', 'Pendentes', 'Inconsistências'],
        datasets: [{
          data: [stats.escrituradas, stats.pendentes, stats.comInconsistencia],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }]
      },
      tableData: {
        headers: ['Status', 'Total Documentos', 'Valor Estimado', 'Últ. Importação', 'Últ. Escrituração'],
        rows: [
          [
            '✅ Escrituradas', 
            stats.escrituradas, 
            fmtR(stats.valorTotalNFes),
            getMaxDateStr(nfes.filter((n: any) => n.status_escrituracao === 'escriturada'), 'created_at'),
            getMaxDateStr(nfes.filter((n: any) => n.status_escrituracao === 'escriturada'), 'data_classificacao') || getMaxDateStr(nfes.filter((n: any) => n.status_escrituracao === 'escriturada'), 'updated_at')
          ],
          [
            '⏳ Pendentes', 
            stats.pendentes, 
            '--',
            getMaxDateStr(nfes.filter((n: any) => n.status_escrituracao === 'pendente'), 'created_at'),
            '--'
          ],
          [
            '⚠️ Inconsistências', 
            stats.comInconsistencia, 
            '--',
            getMaxDateStr(nfes.filter((n: any) => n.status_escrituracao === 'com_inconsistencia'), 'created_at'),
            '--'
          ]
        ]
      }
    },
    nfse: {
      id: 'nfse',
      title: 'Raio-X: Serviços Tomados (NFS-e)',
      subtitle: 'Conformidade Fiscal de Serviços',
      icon: <FileText size={16} />,
      chartType: 'doughnut',
      chartData: {
        labels: ['Concluídas', 'Pendentes'],
        datasets: [{
          data: [nfseStats.concluidas, nfseStats.pendentes],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderWidth: 0
        }]
      },
      tableData: {
        headers: ['Status', 'Total Documentos', 'Valor Estimado', 'Últ. Importação', 'Últ. Escrituração'],
        rows: [
          [
            '✅ Escrituradas', 
            nfseStats.concluidas, 
            fmtR(nfseStats.valorTotal),
            getMaxDateStr((nfseHook?.nfses || []).filter((n: any) => n.status_escrituracao === 'concluida'), 'created_at'),
            getMaxDateStr((nfseHook?.nfses || []).filter((n: any) => n.status_escrituracao === 'concluida'), 'updated_at')
          ],
          [
            '⏳ Pendentes', 
            nfseStats.pendentes, 
            '--',
            getMaxDateStr((nfseHook?.nfses || []).filter((n: any) => n.status_escrituracao === 'pendente'), 'created_at'),
            '--'
          ]
        ]
      }
    }
  }), [stats, nfseStats])

  const totalGeralDocs = stats.total + nfseStats.total
  const totalPendentes = stats.pendentes + nfseStats.pendentes
  const totalEscrituradas = stats.escrituradas + nfseStats.concluidas
  const valorTotalGeral = stats.valorTotalNFes + nfseStats.valorTotal

  const kpis = [
    { label: 'Total Docs', value: totalGeralDocs, icon: FileText, color: '#6366f1', sub: 'NF-e + NFS-e' },
    { label: 'Pendentes Gerais', value: totalPendentes, icon: Clock, color: '#f59e0b', sub: 'aguardando' },
    { label: 'Escrituradas', value: totalEscrituradas, icon: CheckCircle, color: '#10b981', sub: 'concluídas' },
    { label: 'Vlr Total Notas', value: fmtR(valorTotalGeral), icon: DollarSign, color: '#3b82f6', sub: 'produtos e serviços' },
    { label: 'Inconsistências', value: stats.comInconsistencia, icon: AlertTriangle, color: '#ef4444', sub: 'NF-e (Mod 55)' },
    { label: 'Total ICMS/IPI', value: fmtR(stats.valorTotalICMS + stats.valorTotalIPI), icon: TrendingUp, color: '#8b5cf6', sub: 'mercadorias' },
    { label: 'Retenções (NFS-e)', value: fmtR(nfseStats.valorRetencoes), icon: DollarSign, color: '#0ea5e9', sub: 'IRRF, PCC, ISS' },
    { label: 'PIS/COFINS (NF-e)', value: fmtR(stats.valorTotalPIS + stats.valorTotalCOFINS), icon: BarChart3, color: '#f43f5e', sub: 'sobre mercadorias' },
  ]

  // Agrupar NF-e por emitente para ranking
  const porEmitente: Record<string, { nome: string; total: number; qtd: number }> = {}
  nfes.forEach((n: any) => {
    if (!porEmitente[n.cnpj_emitente]) {
      porEmitente[n.cnpj_emitente] = { nome: n.nome_emitente || n.cnpj_emitente, total: 0, qtd: 0 }
    }
    porEmitente[n.cnpj_emitente].total += Number(n.valor_total || 0)
    porEmitente[n.cnpj_emitente].qtd++
  })
  const topEmitentes = Object.values(porEmitente).sort((a, b) => b.total - a.total).slice(0, 5)

  // Progresso de escrituração
  const pctNfe = stats.total > 0 ? Math.round((stats.escrituradas / stats.total) * 100) : 0
  const pctNfse = nfseStats.total > 0 ? Math.round((nfseStats.concluidas / nfseStats.total) * 100) : 0

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const periodosOpcoes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: val, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  const currentPeriod = nfeHook.filterPeriodo || 'all'

  const handlePeriodoChange = (val: string) => {
    nfeHook.setFilterPeriodo(val === 'all' ? '' : val)
    if (nfseHook) nfseHook.setPeriodo(val)
  }

    const kpiStatusClass = (valor: number) => {
      return valor > 0 ? 'kpi-alert' : 'kpi-neutral'
    }

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-700">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4" style={{ gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr' }}>
          {/* Card 1: Valor Total (Hero) */}
          <div className="bg-[#0e2d22] text-white p-5 rounded-[24px] shadow-sm hover:shadow-md flex flex-col justify-between h-full transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/70 mb-2">Valor Total das Notas</p>
            <div>
              <h2 className="text-2xl font-black mb-1">{fmtR(valorTotalGeral)}</h2>
            </div>
          </div>

          {/* Card 2: Escrituradas */}
          <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm hover:shadow-md hover:border-slate-200 flex flex-col justify-between h-full transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3f8f7c]" />
              <p className="text-[10px] font-black text-[#3f8f7c] uppercase tracking-widest">Escrituradas</p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">{totalEscrituradas}</h2>
              <p className="text-[10px] text-slate-400 leading-tight">
                {totalEscrituradas} de {totalGeralDocs} documentos totais
                {totalPendentes > 0 && <span className="block text-orange-500 mt-1">{totalPendentes} pendentes gerais</span>}
              </p>
            </div>
          </div>

          {/* Card 3: Pendentes */}
          <div className={`bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm hover:shadow-md hover:border-slate-200 flex flex-col justify-between h-full transition-all ${kpiStatusClass(stats.pendentes)}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Pendentes</p>
            <div>
              <h2 className="text-2xl font-black kpi-value mb-1">{stats.pendentes}</h2>
              <p className="text-[10px] opacity-70 leading-tight">{stats.pendentes === 0 ? 'nada a revisar' : 'requer atenção'}</p>
            </div>
          </div>

          {/* Card 4: Inconsistências */}
          <div className={`bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm hover:shadow-md hover:border-slate-200 flex flex-col justify-between h-full transition-all ${kpiStatusClass(stats.comInconsistencia)}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Inconsistências</p>
            <div>
              <h2 className="text-2xl font-black kpi-value mb-1">{stats.comInconsistencia}</h2>
              <p className="text-[10px] opacity-70 leading-tight">{stats.comInconsistencia === 0 ? 'tudo consistente' : 'verificar erros'}</p>
            </div>
          </div>

          {/* Card 5: ICMS / IPI */}
          <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm hover:shadow-md hover:border-slate-200 flex flex-col justify-between h-full transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total ICMS/IPI</p>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">{fmtR(stats.valorTotalICMS + stats.valorTotalIPI)}</h2>
              <p className="text-[10px] text-slate-400 leading-tight">apurado no período</p>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raio-X NF-e (Modelo 55) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative group cursor-pointer hover:shadow-md transition-all" onClick={() => setExpandedChart(chartConfigs.nfe)}>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={16} className="text-slate-300" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-blue-600" />
            <h3 className="text-sm font-black text-slate-700">Raio-X: Mercadorias (NF-e Mod 55)</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                  strokeDasharray={`${pctNfe} ${100 - pctNfe}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800">{pctNfe}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-600 font-bold">✅ Escrituradas</span>
                <span className="font-black">{stats.escrituradas}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-orange-500 font-bold">⏳ Pendentes</span>
                <span className="font-black">{stats.pendentes}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-500 font-bold">⚠️ Inconsistências</span>
                <span className="font-black">{stats.comInconsistencia}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-2">
                <span className="text-slate-500 font-bold">Total Recebidas</span>
                <span className="font-black">{stats.total}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-700">Valor Total das NF-e: {fmtR(stats.valorTotalNFes)}</p>
          </div>
        </div>

        {/* Raio-X NFS-e (Serviços) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative group cursor-pointer hover:shadow-md transition-all" onClick={() => setExpandedChart(chartConfigs.nfse)}>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={16} className="text-slate-300" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black text-slate-700">Raio-X: Serviços Tomados (NFS-e)</h3>
          </div>
          {nfseStats.total === 0 ? (
            <div className="empty-state py-10 mt-4">
              <div className="ic-big">📄</div>
              <p className="msg">
                Nenhuma NFS-e recebida neste período.
                Importe suas notas de serviço para começar a escrituração.
              </p>
              <button className="bg-[#12a793] hover:bg-[#0f8e7d] text-white text-[11px] font-black px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm uppercase tracking-widest">
                ⬆ Importar NFS-e
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                      strokeDasharray={`${pctNfse} ${100 - pctNfse}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800">{pctNfse}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600 font-bold">✅ Escrituradas</span>
                    <span className="font-black">{nfseStats.concluidas}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-500 font-bold">⏳ Pendentes</span>
                    <span className="font-black">{nfseStats.pendentes}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-2">
                    <span className="text-slate-500 font-bold">Total Recebidas</span>
                    <span className="font-black">{nfseStats.total}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-700">Valor Total das NFS-e: {fmtR(nfseStats.valorTotal)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tributos Federais (NFS-e) e Estoque */}
      <div className="flex flex-col gap-4">
        {/* Tributos Federais (NFS-e) */}
        <div className="panel bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="panel-title flex items-center gap-2 mb-4 font-black text-slate-700 uppercase tracking-widest text-[11px]">
            🧾 Tributos Federais (NFS-e)
          </div>
          <div className="mini-tax">
            <div className="mini-tax-item">
              <div className="l">Retenções</div>
              <div className="v">{fmtR(nfseStats.valorRetencoes)}</div>
            </div>
            <div className="mini-tax-item">
              <div className="l">PIS / COFINS</div>
              <div className="v">{fmtR(stats.valorTotalPIS + stats.valorTotalCOFINS)}</div>
            </div>
          </div>
        </div>

        {/* Estoque summary (Mockup Style) */}
        <div className="stock-summary group" onClick={() => {}}>
          <div className="stock-left flex items-center gap-6 md:gap-12 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <div className="ic text-3xl opacity-80 group-hover:scale-110 transition-transform">📦</div>
            <div className="stock-mini-stats">
              <div><b>{estoqueStats.totalProdutos}</b>Produtos cadastrados</div>
              <div><b>{estoqueStats.produtosAbaixoMinimo}</b>Abaixo do mínimo</div>
              <div><b>{estoqueStats.produtosSemEstoque}</b>Sem estoque</div>
              <div><b>{fmtR(estoqueStats.valorTotalEstoque)}</b>Valor total em estoque</div>
            </div>
          </div>
          <div className="link-arrow flex items-center gap-2 flex-shrink-0">
            Ver Estoque completo <span className="text-lg leading-none">→</span>
          </div>
        </div>
      </div>

      {/* Zoom Modal (Fiscal Compliance) */}
      {expandedChart && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#071a12]/95 backdrop-blur-xl" onClick={() => setExpandedChart(null)} />
          
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-500 border border-white/20">
            {/* Modal Sidebar */}
            <div className="lg:w-[320px] bg-gradient-to-br from-[#061c14] to-[#0e2d22] p-8 text-white flex flex-col justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    {expandedChart.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{expandedChart.title}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-emerald-400 opacity-80">{expandedChart.subtitle}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status da Escrituração</p>
                    <p className="text-sm font-medium">Monitoramento de conformidade fiscal e integridade de dados do SPED.</p>
                  </div>
                  <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Orientações Fiscais</p>
                    <p className="text-[12px] leading-relaxed text-emerald-100 font-bold italic">"Mantenha a escrituração em dia para evitar multas acessórias e garantir o crédito tributário."</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setExpandedChart(null)}
                className="mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                <X size={16} /> Fechar Diagnóstico
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-50 flex flex-col min-h-0 overflow-y-auto">
              <div className="p-8 lg:p-12 border-b border-slate-200">
                <div className="h-[300px] w-full relative">
                  <Doughnut 
                    data={expandedChart.chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      cutout: '75%', 
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } } 
                    }} 
                    plugins={[{
                      id: 'centerTextFiscal',
                      beforeDraw: function(chart: any) {
                        var width = chart.width, height = chart.height, ctx = chart.ctx;
                        ctx.restore();
                        ctx.font = "900 64px Inter, sans-serif";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#1e293b";
                        var total = chart.config.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                        var text = total.toString(), textX = Math.round((width - ctx.measureText(text).width) / 2), textY = height / 2 - 5;
                        ctx.fillText(text, textX, textY);
                        ctx.font = "900 12px Inter, sans-serif";
                        ctx.fillStyle = "#64748b";
                        var text2 = "DOCUMENTOS", text2X = Math.round((width - ctx.measureText(text2).width) / 2), text2Y = height / 2 + 30;
                        ctx.fillText(text2, text2X, text2Y);
                        ctx.save();
                      }
                    }]}
                  />
                </div>
              </div>

              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Auditando Conformidade</h3>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Fiscal</div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {expandedChart.tableData.headers.map((h: string) => (
                          <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {expandedChart.tableData.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          {row.map((cell: any, ci: number) => (
                            <td key={ci} className={`px-6 py-4 text-xs ${ci === 0 ? 'font-bold text-slate-800' : 'font-black text-emerald-600'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
