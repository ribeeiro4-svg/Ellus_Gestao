'use client'
import React from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import CountUp from '../CountUp'
import type { ApresentacaoKpis } from '../../hooks/useApresentacaoData'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

interface SlideInadimplenciaProps {
  kpis: ApresentacaoKpis
}

function InadimplenciaGauge({ rate }: { rate: number }) {
  const clampedRate = Math.min(Math.max(rate, 0), 100)
  const isAlarm = clampedRate > 20
  const isWarning = clampedRate > 10 && clampedRate <= 20

  // SVG gauge: semicírculo
  const R = 80
  const cx = 100
  const cy = 100
  const strokeWidth = 14
  const circumference = Math.PI * R
  const offset = circumference - (clampedRate / 100) * circumference

  const trackColor = '#1a2e22'
  const fillColor = isAlarm ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Track */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="28" fontWeight="900">
          {clampedRate.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700" letterSpacing="2">
          INADIMPLÊNCIA
        </text>
        {/* Scale labels */}
        <text x={cx - R - 4} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">0%</text>
        <text x={cx + R + 4} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">100%</text>
      </svg>
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAlarm ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : isWarning ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {isAlarm ? 'Nível Crítico' : isWarning ? 'Atenção' : 'Nível Saudável'}
      </div>
    </div>
  )
}

export default function SlideInadimplencia({ kpis }: SlideInadimplenciaProps) {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-rose-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[3px] text-rose-400/70">Ponto de Atenção</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Inadimplência</h2>
          <p className="text-sm text-white/30 font-semibold mt-1">Associados com lançamentos em atraso</p>
        </div>

        <div className="grid grid-cols-2 gap-6 flex-1">
          {/* Left: Gauge + KPIs */}
          <div className="flex flex-col items-center justify-center gap-6 p-6 rounded-[24px] bg-white/5 border border-white/10">
            <InadimplenciaGauge rate={kpis.inadimplenciaRate} />

            <div className="flex gap-6 w-full justify-center">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Valor Total</p>
                <div className="text-lg font-black text-rose-400">
                  <CountUp value={kpis.inadimplenciaValor} prefix="R$ " decimals={0} duration={900} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Top devedores */}
          <div className="flex flex-col gap-3 p-6 rounded-[24px] bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-400" />
              <p className="text-[10px] font-black uppercase tracking-[2px] text-white/50">Maiores Devedores</p>
            </div>

            {kpis.topDevedores.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/20 text-sm font-bold">Nenhuma inadimplência!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 flex-1">
                {kpis.topDevedores.map((dev, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white/80 truncate">{dev.nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} className="text-white/30" />
                        <p className="text-[10px] text-white/30 font-semibold">{dev.diasAtraso} dias em atraso</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-rose-400 shrink-0">
                      R$ {dev.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
