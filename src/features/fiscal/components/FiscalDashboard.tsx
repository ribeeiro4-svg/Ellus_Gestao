'use client'
import React from 'react'
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function FiscalDashboard({ nfeHook, estoqueHook }: { nfeHook: any; estoqueHook: any }) {
  const { stats, nfes } = nfeHook
  const estoqueStats = estoqueHook.stats

  const kpis = [
    { label: 'Total NF-e', value: stats.total, icon: FileText, color: '#6366f1', sub: 'no período' },
    { label: 'Pendentes', value: stats.pendentes, icon: Clock, color: '#f59e0b', sub: 'aguardando classificação' },
    { label: 'Escrituradas', value: stats.escrituradas, icon: CheckCircle, color: '#10b981', sub: 'concluídas' },
    { label: 'Inconsistências', value: stats.comInconsistencia, icon: AlertTriangle, color: '#ef4444', sub: 'requerem atenção' },
    { label: 'Total ICMS', value: fmtR(stats.valorTotalICMS), icon: DollarSign, color: '#8b5cf6', sub: 'destacado nas NF-e' },
    { label: 'Total IPI', value: fmtR(stats.valorTotalIPI), icon: TrendingUp, color: '#06b6d4', sub: 'destacado nas NF-e' },
    { label: 'Total PIS', value: fmtR(stats.valorTotalPIS), icon: BarChart3, color: '#f43f5e', sub: 'PIS das entradas' },
    { label: 'Total COFINS', value: fmtR(stats.valorTotalCOFINS), icon: BarChart3, color: '#f97316', sub: 'COFINS das entradas' },
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
  const pct = stats.total > 0 ? Math.round((stats.escrituradas / stats.total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-white/60 backdrop-blur-md border border-white/40 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ background: kpi.color }} 
              />
              
              <div className="flex flex-col gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${kpi.color}15` }}
                >
                  <Icon size={14} style={{ color: kpi.color }} />
                </div>
                
                <div>
                  <p className="text-lg font-black text-slate-800 leading-none">{kpi.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{kpi.label}</p>
                  <p className="text-[9px] text-slate-300 font-medium leading-tight">{kpi.sub}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progresso de escrituração */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-700 mb-4">📊 Progresso de Escrituração</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800">{pct}%</span>
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
                <span className="text-slate-500 font-bold">Total</span>
                <span className="font-black">{stats.total}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-700">💡 Total das NF-e: {fmtR(stats.valorTotalNFes)}</p>
          </div>
        </div>

        {/* Top emitentes */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-700 mb-4">🏭 Top Fornecedores (por valor)</h3>
          {topEmitentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
              <FileText size={32} className="mb-2" />
              <p className="text-xs font-bold">Nenhuma NF-e importada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topEmitentes.map((e, i) => {
                const maxVal = topEmitentes[0].total
                const pctBar = maxVal > 0 ? (e.total / maxVal) * 100 : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 truncate max-w-[180px]">{e.nome}</span>
                      <span className="font-black text-slate-800 ml-2">{fmtR(e.total)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pctBar}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{e.qtd} nota(s)</p>
                  </div>
                )
              })}
            </div>
          )}
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
