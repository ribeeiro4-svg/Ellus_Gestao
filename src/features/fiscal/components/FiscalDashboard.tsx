'use client'
import React from 'react'
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, Package, BarChart3, Calendar } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function FiscalDashboard({ nfeHook, estoqueHook, nfseHook }: { nfeHook: any; estoqueHook: any; nfseHook?: any }) {
  const { stats, nfes } = nfeHook
  const estoqueStats = estoqueHook.stats
  const nfseStats = nfseHook ? nfseHook.stats : { total: 0, pendentes: 0, concluidas: 0, valorTotal: 0, valorRetencoes: 0 }

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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Filtro de Período Global */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Período de Análise</h3>
            <p className="text-[10px] font-bold text-slate-400">Dados consolidados em tempo real</p>
          </div>
        </div>
        
        <select 
          value={currentPeriod} 
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700 outline-none hover:bg-slate-100 transition-all cursor-pointer min-w-[220px]"
        >
          <option value="all">Visão Consolidada (Geral)</option>
          {periodosOpcoes.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      {/* KPIs */}
      <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-1 opacity-70">
                <Icon size={12} style={{ color: kpi.color }} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate">{kpi.label}</span>
              </div>
              <div className="text-base font-black text-slate-800" style={{ color: i > 3 ? kpi.color : undefined }}>
                {kpi.value}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raio-X NF-e (Modelo 55) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
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
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black text-slate-700">Raio-X: Serviços Tomados (NFS-e)</h3>
          </div>
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
        </div>
      </div>

      {/* Estoque summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Produtos Cadastrados', value: estoqueStats.totalProdutos, color: '#6366f1' },
          { label: 'Abaixo do Mínimo', value: estoqueStats.produtosAbaixoMinimo, color: '#f59e0b' },
          { label: 'Sem Estoque', value: estoqueStats.produtosSemEstoque, color: '#ef4444' },
          { label: 'Valor Total Estoque', value: fmtR(estoqueStats.valorTotalEstoque), color: '#10b981' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="text-lg font-black text-slate-800">{item.value}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">{item.label}</div>
            <div className="h-0.5 mt-3 rounded-full" style={{ background: item.color }} />
          </div>
        ))}
      </div>
    </div>
  )
}
