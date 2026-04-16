'use client'
import React, { useMemo } from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, fmtPct } from '@/lib/utils/formatters'
import { AlertTriangle, TrendingDown, Users, ShieldAlert } from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function InadimplenciaPage() {
  const { associados, loading } = useAssociados()
  
  const inadimp = useMemo(() => 
    associados.filter(a => (a.status || '').toLowerCase().includes('inadimp')), 
  [associados])

  // ── Cálculos ──
  const totalDevido = useMemo(() => 
    inadimp.reduce((acc, a) => acc + (a.mensalidade * (a.meses_atraso || 0)), 0),
  [inadimp])

  const ticketMedioAtraso = inadimp.length > 0 ? totalDevido / inadimp.length : 0
  const pctInadimpTotal = (inadimp.length / (associados.length || 1)) * 100

  // Curva de atraso
  const curva = useMemo(() => {
    let m1 = 0, m2 = 0, m3 = 0, m3plus = 0
    inadimp.forEach(a => {
      const ms = a.meses_atraso || 0
      if (ms === 1) m1++
      else if (ms === 2) m2++
      else if (ms === 3) m3++
      else if (ms > 3) m3plus++
    })
    return [m1, m2, m3, m3plus]
  }, [inadimp])

  const columns = [
    { 
      header: 'Associado', 
      key: 'nome', 
      render: (i: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100">
            {(i.nome || 'A')[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{i.nome}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{i.codigo} — {i.categoria}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Atraso', 
      key: 'meses_atraso', 
      render: (i: any) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg font-black text-sm ${i.meses_atraso > 3 ? 'text-red-700 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>
            {i.meses_atraso || 0}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">meses</span>
        </div>
      )
    },
    { 
      header: 'Valor Total', 
      key: 'total', 
      render: (i: any) => (
        <div className="flex flex-col">
           <span className="text-sm font-black text-red-600">{fmtR((i.mensalidade || 0) * (i.meses_atraso || 0))}</span>
           <span className="text-[10px] text-slate-400 font-medium">Ref: {fmtR(i.mensalidade)}/mês</span>
        </div>
      )
    },
    { 
      header: 'Último Pagamento', 
      key: 'ultimo_pagamento', 
      render: (i: any) => (
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-semibold">{i.ultimo_pagamento ? fmtData(i.ultimo_pagamento) : 'Sem registro'}</span>
        </div>
      )
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="page-title">Painel de Inadimplência</div>
            <div className="page-subtitle">Controle de recebíveis em atraso — ACPROBEC</div>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Devido', value: fmtR(totalDevido), sub: `${inadimp.length} associados`, icon: ShieldAlert, color: 'var(--red)' },
          { label: 'Inadimplência', value: fmtPct(pctInadimpTotal), sub: 'da carteira total', icon: TrendingDown, color: 'var(--orange)' },
          { label: 'Ticket Médio', value: fmtR(ticketMedioAtraso), sub: 'por devedor', icon: Users, color: 'var(--text2)' },
          { label: 'Acima de 3 Meses', value: curva[3], sub: 'casos críticos', icon: AlertTriangle, color: 'var(--red)' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: k.color }}>{k.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">{k.sub}</p>
            </div>
            <k.icon size={40} className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform" />
          </div>
        ))}
      </div>

      {/* ── Gráfico e Alerta ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="Curva de Atraso" subtitle="Distribuição por meses vencidos">
            <div className="h-[240px] mt-4">
              <Doughnut 
                data={{
                  labels: ['1 Mês', '2 Meses', '3 Meses', '3+ Meses'],
                  datasets: [{
                    data: curva,
                    backgroundColor: ['#fcd34d', '#fb923c', '#ef4444', '#991b1b'],
                    borderWidth: 0,
                    hoverOffset: 10
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 15 } }
                  },
                  cutout: '75%'
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
               <ShieldAlert size={16} className="text-red-500" /> Associados com Maior Débito
            </h4>
            <div className="flex-1 space-y-4">
               {inadimp.sort((a,b) => (b.mensalidade * (b.meses_atraso || 0)) - (a.mensalidade * (a.meses_atraso || 0))).slice(0, 3).map((a, idx) => (
                 <div key={a.id} className="flex items-center justify-between p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-red-200">#{idx+1}</span>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{a.nome}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{a.meses_atraso} meses em aberto</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-red-600">{fmtR(a.mensalidade * (a.meses_atraso || 0))}</p>
                       <button className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Acionar</button>
                    </div>
                 </div>
               ))}
               {inadimp.length === 0 && (
                 <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm">
                    Nenhum inadimplente encontrado. Parabéns!
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="p-5 border-b border-slate-100">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Listagem Detalhada</h4>
        </div>
        <DataTable columns={columns} data={inadimp} loading={loading} />
      </div>
    </div>
  )
}

